# Run project
```
nvm use 16.18.1
npm install --include=dev
npm run dev
```
Now, access: http://127.0.0.1:5173/ 

# Settings Live Server
- Change path key and cert in ./.vscode/settings.json

# Deploy to firebase
```
npm install -g firebase-tools
firebase login
firebase init
npm run build
firebase deploy
```

## Github
1. Reset commit master
```
git branch -f master HEAD
git push origin master --force
```
