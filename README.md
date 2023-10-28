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

## Rule
1. class-transformer: Không dùng giá trị mặc định của class, lý do:
- Khi dùng mặc định của class, có thể gen ra giá trị mặc dù không hề Expose group nó
- Dùng @Transform. Group nào Expose mới có giá trị mặc định !!!
2. Emit data phải là dữ liệu mới (copy tạo mới rồi mới gửi)
