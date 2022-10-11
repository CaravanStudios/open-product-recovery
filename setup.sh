#!/bin/bash
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
