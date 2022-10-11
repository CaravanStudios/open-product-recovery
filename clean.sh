#!/bin/bash
# Build model code
echo Cleaning models...
cd opr-models
rm -r -f build
rm -r -f node_modules
cd ..
echo Cleaning core...
cd opr-core
rm -r -f build
rm -r -f node_modules
cd ..
echo Projects cleaned