sh ./clean.sh
# Install will currently fail because the post-install "prepare" scripts just run 
# when that package's install script finishes. This forces the install command
# to not run the post-install scripts. So we then separately run the compile.
# This is discussed here: https://github.com/npm/cli/issues/3034
npm install --workspaces --ignore-scripts --include-workspace-root
npm run compile --workspaces
# TypeORM is currently unable to locate the sqlite driver when using workspaces 
# using a normal install. Calling rebuild here corrects this issue.
npm rebuild


