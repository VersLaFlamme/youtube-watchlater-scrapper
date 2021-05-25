#
This scrapper downloads all #watch later# videos from your youtube account
## Installation
```
npm i
```
## Credentials
create .env file in the root directory with your google email and password
```
EMAIL=test@gmail.com
PASSWORD=test
```
## Run script
```
npm run start
```
If you receive `Error: Cannot find module 'm3u8stream/lib/parse-time'` Error
then run
```
cp -r ./node_modules/m3u8stream/dist ./node_modules/m3u8stream/lib
```
and retry `npm run start`
## Downloads
All videos are downloaded to the './downloads' directory
