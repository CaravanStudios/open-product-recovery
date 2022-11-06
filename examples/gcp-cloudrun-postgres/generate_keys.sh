#!/bin/bash
# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

cd ../opr-core
npm run generatekeypair -- --publicfile opr-public-key.json --privatefile opr-private-key.json
gsutil cp opr-public-key.json gs://$1-config/publickeys/opr-public-key.json
gsutil cp opr-private-key.json gs://$1-config/opr-private-key.json
rm opr-public-key.json
rm opr-private-key.json
