## Refonline Checker
If you're waiting for the test results of your COVID-19 test in South Tyrol and you got a token to check online for the result and you don't want to manually check the online portal every now and then, then this is made for you. All you need is a running PC, Node.js installed and a working internet connection.

#### Requirements:
- Node.js (I've only tested it with the latest 15.x version)

#### Step-by-Step
1) Install Node.js on your PC
2) Clone this repository
3) Run `npm i` to install the required NPM packages
4) Copy the `config.json.example` and name it `config.json`
5) Edit the `config.json` file and add as many users as you want according to the predefined schema (name, fiscal code and token)
6) If you want to receive a notification over Telegram, also complete the `telegram` fields.
7) Run `node index.mjs`, which will check the online portal every ~10 seconds for each user you specified inside `config.json`

If no report was found, a message will be logged to the console each time a check is done.
If during an iteration one or more reports were found, you well get a OS-native notification and if provided also a Telegram-notification.