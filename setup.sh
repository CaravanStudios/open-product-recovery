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

# exit when any command fails
set -e
# 0 for false (do install), 1 for true (skip install)
NO_INSTALL=false

# keep track of the last executed command
trap 'last_command=$current_command; current_command=$BASH_COMMAND' DEBUG
# echo an error message before exiting
trap 'if [[ $? -ne 0 ]]; then echo "\"${last_command}\" command failed with exit code $?."; fi' EXIT
echo Building devtools...
cd opr-devtools
if [ "$NO_INSTALL" != true ]
then
  npm install
fi
npm run build
cd ..
echo Building models...
cd opr-models
if [ "$NO_INSTALL" != true ]
then
  npm install
fi
npm run build
cd ..
echo Building core...
cd opr-core
if [ "$NO_INSTALL" != true ]
then
  npm install
fi
npm run build
cd ..
echo Building sql...
cd opr-sql-database
if [ "$NO_INSTALL" != true ]
then
  npm install
fi
npm run build
cd ..
echo Building gcp...
cd opr-google-cloud
if [ "$NO_INSTALL" != true ]
then
  npm install
fi
npm run build
cd ..
echo Building examples...
cd opr-example-server
if [ "$NO_INSTALL" != true ]
then
  npm install
fi
npm run build
cd ..
echo Success!
echo "Check out opr-example-server to try out OPR!"
