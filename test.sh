#!/bin/bash
# exit when any command fails
set -e

Help()
{
   # Display Help
   echo "Testing utility for OPR."
   echo "Optionally, list libraries to test. The -s flag inverts this, so that named libraries are skipped."
   echo
   echo "Syntax: test [-s|h] [named libraries to test]"
   echo "options:"
   echo "h     Display help."
   echo "s     Skip any named libraries."
   echo
}

# keep track of the last executed command
trap 'last_command=$current_command; current_command=$BASH_COMMAND' DEBUG
# echo an error message before exiting
trap 'if [[ $? -ne 0 ]]; then echo "\"${last_command}\" command failed with exit code $?."; fi' EXIT

skipnamed=false
while getopts 'sh' flag; do
  case "${flag}" in
    s) skipnamed=true ;;
    h) Help; exit;;
  esac
done

if ([ $skipnamed == true ] && [ $# -eq 1 ]); then
echo "ERROR: SKIP OPTION PROVIDED, BUT NO MODULES TO SKIP"
exit
fi


if ([ $# -eq 0 ]) || ([ $skipnamed == false ] && [[ " ${@} " =~ " opr-models " ]] ) || ([ $skipnamed == true ] && ! [[ " ${@} " =~ " opr-models " ]] ); then
echo Testing models...
cd opr-models
npm run test
cd ..
fi

if ([ $# -eq 0 ]) || ([ $skipnamed == false ] && [[ " ${@} " =~ " opr-devtools " ]] ) || ([ $skipnamed == true ] && ! [[ " ${@} " =~ " opr-devtools " ]] ); then
echo Testing devtools...
cd opr-devtools
npm run test
cd ..
fi

if ([ $# -eq 0 ]) || ([ $skipnamed == false ] && [[ " ${@} " =~ " opr-core " ]] ) || ([ $skipnamed == true ] && ! [[ " ${@} " =~ " opr-core " ]] ); then
echo Testing core...
cd opr-core
npm run test
cd ..
fi

if ([ $# -eq 0 ]) || ([ $skipnamed == false ] && [[ " ${@} " =~ " opr-sql-database " ]] ) || ([ $skipnamed == true ] && ! [[ " ${@} " =~ " opr-sql-database " ]] ); then
echo Testing sql database...
cd opr-sql-database
npm run test
cd ..
fi

if ([ $# -eq 0 ]) || ([ $skipnamed == false ] && [[ " ${@} " =~ " opr-google-cloud " ]] ) || ([ $skipnamed == true ] && ! [[ " ${@} " =~ " opr-google-cloud " ]] ); then
echo Testing google-cloud...
cd opr-google-cloud
npm run test
cd ..
fi

if ([ $# -eq 0 ]) || ([ $skipnamed == false ] && [[ " ${@} " =~ " opr-example-project " ]] ) || ([ $skipnamed == true ] && ! [[ " ${@} " =~ " opr-example-server " ]] ); then
echo Testing example-server...
cd opr-example-server
npm run test
cd ..
fi

echo Success
