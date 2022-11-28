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

# Publishes the OPR node packages using Google's internal
# publishing infrastructure. Prior to publishing, internal google users must
# run:
# npm login --registry https://wombat-dressing-room.appspot.com/opr-devtools/_ns
# npm login --registry https://wombat-dressing-room.appspot.com/opr-models/_ns
# npm login --registry https://wombat-dressing-room.appspot.com/opr-core/_ns
# npm login --registry https://wombat-dressing-room.appspot.com/opr-sql-database/_ns
# npm login --registry https://wombat-dressing-room.appspot.com/opr-google-cloud/_ns
# npm login --registry https://wombat-dressing-room.appspot.com/opr-core-testutil/_ns

npx lerna run build
npx lerna run test
npx lerna publish --no-private
