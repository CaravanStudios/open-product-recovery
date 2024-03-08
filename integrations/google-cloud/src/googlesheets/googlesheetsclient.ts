/**
 * Copyright 2023 The Open Product Recovery Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {StatusError} from 'opr-core';
import {google, sheets_v4} from 'googleapis';
import type {
  CredentialBody,
  ExternalAccountClientOptions,
} from 'google-auth-library';

/**
 * A client for reading/writing Google Sheets. This client treats the first row
 * of the spreadsheet as a list of property names, and uses those property names
 * to treat each row as a property/value map.
 *
 * If a header column value contains a space, only characters before the space
 * are used as the property name for that column. Anything after the space can
 * be used as documentation for the column. If multiple columns map to the same
 * property name, the _last_ column with that property name will be mapped to
 * values for that property.
 *
 * All values in the sheet are represented as strings.
 */
export class GoogleSheetsClient {
  readonly id: string;
  readonly sheetId: string;
  private sheets?: sheets_v4.Sheets;
  private credentials?: CredentialBody | ExternalAccountClientOptions;
  private allowWrite: boolean;
  private rowRange?: string;

  constructor(options: GoogleSheetsClientOptions) {
    this.id = 'Sheets reader for ' + options.sheetId;
    this.sheetId = options.sheetId;
    this.sheets = options.sheets;
    this.credentials = options.credentials;
    this.allowWrite = options.allowWrite === true;
    this.rowRange = options.rowRange;
  }

  private async getSheetsApi(): Promise<sheets_v4.Sheets> {
    if (!this.sheets) {
      const authClient = await google.auth.getClient({
        credentials: this.credentials,
        scopes: [
          this.allowWrite
            ? 'https://www.googleapis.com/auth/spreadsheets'
            : 'https://www.googleapis.com/auth/spreadsheets.readonly',
        ],
      });
      this.sheets = google.sheets({
        version: 'v4',
        auth: authClient,
      });
    }
    return this.sheets;
  }

  private getPropName(value: unknown): string {
    const strValue = String(value);
    let endIndex = strValue.indexOf(' ');
    if (endIndex < 0) {
      endIndex = strValue.length;
    }
    return strValue.substring(0, endIndex);
  }

  protected toSheetDataRows(
    values: Array<Array<unknown>> = []
  ): Array<SheetDataRow> {
    const propNames = values[0].map(x => this.getPropName(x));
    const result = [];
    for (let i = 1; i < values.length; i++) {
      const row = values[i].map(x => String(x));
      const obj = new SheetDataRow(propNames, row, i);
      result.push(obj);
    }
    return result;
  }

  /** Returns all rows in the spreadsheet as sheet data rows. */
  async getRows(rowRange?: string): Promise<Array<SheetDataRow>> {
    const sheetsApi = await this.getSheetsApi();
    const values = (
      await sheetsApi.spreadsheets.values.get({
        spreadsheetId: this.sheetId,
        range: rowRange ?? this.rowRange,
      })
    ).data.values;
    return this.toSheetDataRows(values || undefined);
  }

  /** Returns the first row that matches a find function. */
  async findRow(
    findFn: (x: SheetDataRow) => boolean,
    rowRange?: string
  ): Promise<SheetDataRow | undefined> {
    const rows = await this.getRows(rowRange);
    return rows.find(findFn);
  }

  /**
   * Sets the given columns of a row (as property names) to the given values.
   */
  async setValues(row: SheetDataRow, values: Record<string, string>) {
    const sheetsApi = await this.getSheetsApi();
    const newData = [...row.data];
    for (const key in values) {
      const index = row.getPropColIndex(key);
      if (index !== undefined && index < newData.length) {
        newData[index] = values[key];
      }
    }
    const range = `A${row.rowIndex + 1}`;
    await sheetsApi.spreadsheets.values.update({
      spreadsheetId: this.sheetId,
      range: range,
      requestBody: {
        range: range,
        majorDimension: 'ROWS',
        values: [newData],
      },
    });
  }

  async setProperty(
    row: SheetDataRow,
    propertyName: string,
    value: string
  ): Promise<void> {
    const sheetsApi = await this.getSheetsApi();
    const range = row.getPropCellA1(propertyName);
    if (!range) {
      throw new StatusError(
        'Could not find property ' + propertyName,
        'SHEETS_ERROR_UNKNOWN_PROPERTY'
      );
    }
    await sheetsApi.spreadsheets.values.update({
      spreadsheetId: this.sheetId,
      range: range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        range: range,
        majorDimension: 'ROWS',
        values: [[value]],
      },
    });
  }
}

/**
 * Options for creating a google sheets client.
 */
export interface GoogleSheetsClientOptions {
  sheetId: string;
  /** Default range used if none is provided when requesting/searching rows. */
  rowRange?: string;
  /**
   * An instance of the sheets API. If ommitted, one is created from the
   * provided credentials.
   */
  sheets?: sheets_v4.Sheets;
  /**
   * Credentials to use to create a sheets API. If ommitted, Default Application
   * Credentials are used.
   */
  credentials?: CredentialBody | ExternalAccountClientOptions;
  /**
   * Whether this client has write permission. If this is set to true, this
   * client will request access credentials with write permissions. This must
   * be set to true to use the setProperty() method.
   */
  allowWrite?: boolean;
}

/** A representation of a spreadsheet row as a property/value map. */
export class SheetDataRow {
  private propToColIndex: Record<string, number>;
  readonly data: Array<string>;
  readonly rowIndex: number;

  constructor(headerRow: Array<string>, data: Array<string>, rowIndex: number) {
    this.propToColIndex = {};
    for (let i = 0; i < headerRow.length; i++) {
      this.propToColIndex[headerRow[i]] = i;
    }
    this.data = data;
    this.rowIndex = rowIndex;
  }

  /** Returns the value at the given column index. */
  getValueAtColIndex(colIndex: number): string {
    if (colIndex > this.data.length || colIndex < 0) {
      throw new Error(colIndex + ' out of range');
    }
    return this.data[colIndex];
  }

  /** Returns this row's value for the given property name. */
  getProp(name: string): string | undefined {
    const index = this.getPropColIndex(name);
    if (index === undefined) {
      return undefined;
    }
    return this.data[index];
  }

  /** Returns the column index for the given property name. */
  getPropColIndex(name: string): number | undefined {
    return this.propToColIndex[name];
  }

  /**
   * Returns the address of the cell with the given property name in this row.
   * The address is formatted in Google Sheets A1 format.
   */
  getPropCellA1(name: string): string | undefined {
    // Adapted from code sample at:
    // https://www.labnol.org/convert-column-a1-notation-210601
    const columnIndex = this.getPropColIndex(name);
    if (columnIndex === undefined) {
      return undefined;
    }
    const a1Notation = [`${this.rowIndex + 1}`];
    const totalAlphabets = 'Z'.charCodeAt(0) - 'A'.charCodeAt(0) + 1;
    let block = columnIndex;
    while (block >= 0) {
      a1Notation.unshift(
        String.fromCharCode((block % totalAlphabets) + 'A'.charCodeAt(0))
      );
      block = Math.floor(block / totalAlphabets) - 1;
    }
    return a1Notation.join('');
  }
}
