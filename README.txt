WELCOME TO THE ODYSSEY BOT

Setup:
1. This is a node.js application. Start by making sure you have node installed, and if you don't go here (https://nodejs.org/en/download/) and follow the install instructions.
2. Install tbe bot running `npm install` in the odysseyBot directory via the command line. This will download any dependancies and install them.
3. Perform the Discord Setup.
4. Setup the bot.json properties file for the bot. An example should be included with the zip but if it isn't a basic example is at the bottom of this file.
NOTE: The name of the file can be set on the command line run but if none is set it will default to bot.json.
5. Run the bot with `node ./odysseyBot.js`

Discord Setup:
1. Go to the discord developer applications page (https://discordapp.com/developers/applications) and create a new application.
2. Go into your new application and on the left side (or in a menu if you're on mobile or have a small window) and select 'Bot' then click the 'Add Bot' button and 'Yes'.
3. From the next page get the Bot's Token for the configuration file during bot setup.
4. Navigate to the OAuth2 section of the Applications page and scroll to Scopes. Select 'bot' and copy the link it generates at the bottom and pase it into your browser. The select your server to add the bot to it.


What does it do?
The bot is set up with 4 simple functions:
1. User join greeting. The bot will send a message out whenever a new user joins the server.
2. Role self-assignment. The bot will assign two designated roles to users upon request.
3. Meeting Reminder. The bot will send a notification 24h before a designated meeting time.
4. General text commands. The bot can be set up to respond to any kind of specific text command.


SAMPLE bot.json CONFIG:
{
  "botname":"Odyssey Bot", // The bot's name. It will set itself to this on startup only.
  "discordToken":"<TOKEN>", // The discord bot token
  "debug":true, // Set this here to true to output debugging information to the console.
  "adminRole":"507368889865469962", // The admin role id, used for the refresh command.
  "invalidPermissionMessage":"You can't do that!",
  "welcomeChannel":"general", // Channel to send the welcome message to.
  "welcomeMessage":"Welcome to the Odyssey Development server! If you are here to check out progress on the mod, please be aware than all channels other than #general contain spoilers. If you're interested in joining the team, access to additional information and the application form are available on our trello page (LINK: https://trello.com/b/bybjrWOB/odyssey-of-the-dragonborn-home). Please contact icecreamassassin if you submit an application so we can follow up with you. If you have any additional questions, feel free to ask.",
  "callout":"!", // The message start that tells the bot to listen to the command.
  "commands": {
    "actions": { // These are hardcoded commands. They cannot be added to.
      "refresh":"pr", // The left side is the hardcoded value, the right is the chat command that corresponds to it.
      "voiceactor":"va",
      "playtester":"pt"
    },
    "text": { // Custom text response for the bot.
      "faq":"This is where a FAQ would go",
      "test":"new test text!",
      "poop":"haha poop"
    }
  },
  "meeting": { // Setup for the meeting reminder functionality
    "day":3, // Day of the week the meeting is on (0 is Sunday, 6 is Saturday)
    "time":"18:35", // Time of the meeting in 24h time
    "channel":"general",
    "message":"@here, hello meeting",
    "interval":60 // How frequently to check for the reminder (in seconds)
  },
  "roles":{ // Roles to be assigned.
    "playtester":{
      "id":"<ROLEID1>",
      "message":"You have been granted the role {roleName}"
    },
    "voiceactor":{
      "id":"<ROLEID2>",
      "message":"You are now a {roleName}"
    }
  }
}
END SAMPLE bot.json CONFIG
NOTE: for this to work you need to remove the // and everything after them in the file.

Thank you for reading me, my job is fulfilled.