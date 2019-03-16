const Discord = require('discord.js');
const fs = require('fs');

const client = new Discord.Client();
const propFile = process.argv[2];
let properties = getJSON( propFile );
let meetingTimeout = null;

/**
 * The ready event is vital, it means that only _after_ this will your bot start
 * reacting to information received from Discord
 */
client.on( 'ready', () =>
{
  debug( 'Bot connected!' );

  // Rename the bot based on the json data. This is only done at startup.
  if( client.user.username !== properties['botname'] )
  {
    client.user.setUsername( properties['botname'] )
      .then( user =>
        {
          debug( 'Setting name to ' + properties['botname'] );
        } )
      .catch( console.error );
  }

  // Set the initial meeting interval.
  meetingTimeout = initMeetingChecker();
});

// Create an event listner for new guild members
client.on( 'guildMemberAdd', member =>
{
  debug( `User joined guild: ${member.displayName}` );

  // Find the welcome channel object.
  const channel = member.guild.channels
    .find( ch => ch.name === properties['welcomeChannel'] );

  // Send the welcome message if there is a valid welcome channel.
  if( channel )
  {
    channel.send( properties['welcomeMessage'].replace( /\{member\}/g, member ) )
      .then( debug( 'Sent welcome message' ) )
      .catch( console.error );
  }
});

// Create an event listener for messages
client.on( 'message', message =>
{
  // If the bot sent the message we don't care.
  if ( message.author.bot ) { return; }

  // Get the message content and make it lower case to ignore casing.
  let content = message.content.toLowerCase();

  // Check if the message started with the callout.
  if( content.startsWith( properties['callout'] ) )
  {
    // Strip the callout out of the message to get the command.
    let command = content.replace( properties['callout'], '' );
    debug( 'Recieved Command: ' + message.content );

    // Check all the actions to see if the command was an action.
    // This is done this way because the key is the action and the
    // Value is the chat command.
    for( let key in properties['commands']['actions'] )
    {
      if( properties['commands']['actions'][key].toLowerCase() === command )
      {
        // Switch on the action we want to perform.
        switch( key )
        {
          case "refresh":
            if( message.member.roles.find( rl => rl.id === properties['adminRole'] ) )
            {
              refreshProperties();
            }
            else {
              message.reply( properties['invalidPermissionMessage'] );
            }
            break;
          case "voiceactor":
            if( !message.member.roles.find( rl => rl.id === properties['roles']['voiceactor']['id'] ) )
            {
              addRole( message.member, 'voiceactor', message );
            }
            break;
          case "playtester":
            if( !message.member.roles.find( rl => rl.id === properties['roles']['playtester']['id'] ) )
            {
              addRole( message.member, 'playtester', message );
            }
            break;
          case "commands":
            let cmdlist = Object.values( properties['commands']['actions'] )
              .concat( Object.keys( properties['commands']['text'] ) );
            message.channel.send( cmdlist.map( cmd => properties['callout'] + cmd ).join( ', ' ) );
            break;
          default:
            console.error( `Unknown action message ${key}` );
        }
      }
    }

    // Regardless of if there's an action, see if there's a text command.
    let reply = properties['commands']['text'][command];
    if( reply ) message.channel.send( reply );
  }
});

// general error handler.
client.on( 'error', (e) => {
  debug(e);
  console.error( e );
})

// Log our bot in using the token from
// https://discordapp.com/developers/applications/me
client.login( properties['discordToken'] ).catch( it => {
  console.error( 'Invalid Login Token!' );
});

// ------------------- Helper Functions ----------------------//

/**
 * Add a role to the member. If there's a message, send a reply.
 * member Member A member object to get the role.
 * role String A role name configured in the setup.
 * message Message Optional message, if it's passed in reply to it.
 */
function addRole( member, role, message )
{
  let roleid = properties['roles'][role]['id'];
  let roleName = message.guild.roles.find( rl => rl.id === roleid ).name;
  if( member && !member.roles.find( rl => rl.id === roleid ) )
  {
    member.addRole( roleid )
      .then( () => {
        debug( 'Added role ' + role + ' to member ' + member.displayName );
        if( message )
        {
          message.reply( properties['roles'][role]['message']
            .replace( /\{roleName\}/g, roleName ) );
        }
      })
      .catch( console.error );
    }
}

/**
 * Repopulate the properties from the setting file originally passed in.
 */
function refreshProperties()
{
  debug( 'Refreshing properties' );
  properties = getJSON( propFile );
  clearInterval( meetingTimeout );
  meetingTimeout = initMeetingChecker();
}

/**
 * Initialize the meeting interval checker.
 * return Timeout The timeout object the interval is running in.
 */
function initMeetingChecker()
{
  return setInterval( () =>
  {
    // Get the current date and the meeting object.
    let now = new Date();
    let meeting = properties['meeting'];

    // Check for day before the meeting.
    if( now.getDay() === ( meeting['day'] + 6 ) % 7 )
    {
      let hour = parseInt( meeting['time'].split(':')[0] );
      // Check to see if we're 24h before the meeting.
      if( now.getHours() === hour )
      {
        let minute = parseInt( meeting['time'].split(':')[1] );
        // Check to see if we're at the same time as the meeting.
        if( now.getMinutes() === minute )
        {
          // Send the meeting reminder message.
          debug( 'Meeting notice!' );
          const channel = client.channels
            .find( ch => ch.name === properties['meeting']['channel'] );
          channel.send( properties['meeting']['message'] );
        }
      }
    }
  }, properties['meeting']['interval'] * 1000 );
}

/**
 * Outputs the given message if debug is enabled.
 */
function debug( msg )
{
  if( properties['debug'] )
  {
    let date = new Date();
    let timestamp = `[${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate()}-${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}]`;
    console.log( timestamp + msg );
  }
}

/**
 * Read the properties from a given file or default.
 */
function getJSON( file = './bot.json' )
{
  let data = JSON.parse( fs.readFileSync( file, 'utf8' ) );

  if ( data['debug'] ) console.log( data );
  return data;
}
