#!/bin/bash
# Copyright 2023 The Open Product Recovery Authors
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

rm -rf node_modules
rm -rf components/*/build
rm -rf components/*/node_modules
rm -rf integrations/*/build
rm -rf integrations/*/node_modules
rm -rf examples/*/build
rm -rf examples/*/node_modules
if [ "--keep-package-lock" != "$1" ]; then
  rm -f components/*/package-lock.json
  rm -f integrations/*/package-lock.json
  rm -f package-lock.json
  rm -f examples/*/package-lock.json
fi
