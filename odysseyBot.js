/* Odyssey Bot - A Node.js discord bot written for the Odyssey of the Dragonborn
 * discord server.
 * Author: Cody Sanford
 * Date: 2019/04/11
 */
const Discord = require('discord.js');
const fs = require('fs');
const { Console } = require('console');

// Setup
const client = new Discord.Client();
const propFile = process.argv[2];
let logger = null;
let properties = getJSON( propFile );
debug(properties);
let meetingTimeout = null;

/**
 * The ready event is vital, it means that only _after_ this will your bot start
 * reacting to information received from Discord
 */
client.on( 'ready', () =>
{
  debug( 'Bot connected!' );

  // Rename the bot based on the json data. This is only done at startup.
  if( client.user.username !== properties.botname )
  {
    client.user.setUsername( properties.botname )
      .then( user =>
        {
          debug( 'Setting name to ' + properties.botname );
        } )
      .catch( error );
  }

  setActivity( properties.activity.name, properties.activity.type );
  // Set the initial meeting interval.
  meetingTimeout = initMeetingChecker();
});

// Create an event listner for new guild members
client.on( 'guildMemberAdd', member =>
{
  debug( `User joined guild: ${member.displayName}` );

  // Find the welcome channel object.
  const channel = member.guild.channels
    .find( ch => ch.name === properties.welcomeChannel );

  // Send the welcome message if there is a valid welcome channel.
  if( channel )
  {
    channel.send( properties.welcomeMessage.replace( /\{member\}/g, member ) )
      .then( debug( 'Sent welcome message' ) )
      .catch( error );
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
  if( content.startsWith( properties.callout ) )
  {
    // Strip the callout out of the message to get the command.
    let command = content.replace( properties.callout, '' );
    debug( 'Recieved Command: ' + message.content );

    // Check all the actions to see if the command was an action.
    // This is done this way because the key is the action and the
    // Value is the chat command.
    for( let key in properties.commands.actions )
    {
      if( properties.commands.actions[key].toLowerCase() === command.split(' ')[0] )
      {
        // Switch on the action we want to perform.
        switch( key )
        {
          case 'refresh':
            if( message.member.roles.find( rl => rl.id === properties.adminRole ) )
            {
              refreshProperties();
            }
            else {
              message.reply( properties.invalidPermissionMessage );
            }
            break;
          case 'voiceactor':
            if( !message.member.roles.find( rl => rl.id === properties.roles.voiceactor.id ) )
            {
              addRole( message.member, 'voiceactor', message );
              addRole( message.member, 'limitedAccess' );
            }
            break;
          case 'playtester':
            if( !message.member.roles.find( rl => rl.id === properties.roles.playtester.id ) )
            {
              addRole( message.member, 'playtester', message );
              addRole( message.member, 'limitedAccess' );
            }
            break;
          case 'notifyme':
            if( !message.member.roles.find( r1 => r1.id === properties.roles.atendee.id ) )
            {
              addRole( message.member, 'atendee', message );
            }
            break;
          case 'commands':
            let cmdlist = Object.values( properties.commands.actions )
              .concat( Object.keys( properties.commands.text ) );
            message.channel.send( cmdlist.map( cmd => properties.callout + cmd ).join( ', ' ) );
            break;
          case 'activity':
            if( message.member.roles.find( rl => rl.id === properties.adminRole ) )
            {
              let type = command.split(' ')[1];
              let name = command.split( type )[1];
              setActivity( name, type );
            }
            else {
              message.reply( properties.invalidPermissionMessage );
            }
            break;
          default:
            error( `Unknown action message ${key}` );
        }
        return;
      }
    }

    // Regardless of if there's an action, see if there's a text command.
    let reply = properties.commands.text[command];
    if( reply ) message.channel.send( reply );
  }
});

// general error handler.
client.on( 'error', (e) => {
  error(`${getTimestamp()} An unknown error occured:`);
  error( e );
});

client.on( 'reconnecting', (e) =>
{
  debug( 'Attempting to reconnect to the server...' );
});

client.on( 'resume', (e) =>
{
  debug( 'Connection resumed' );
});

// Log our bot in using the token from
// https://discordapp.com/developers/applications/me
client.login( properties.discordToken ).catch( it => {
  error( 'Invalid Login Token!' );
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
  let roleid = properties.roles[role].id;
  let roleName = message.guild.roles.find( rl => rl.id === roleid ).name;
  if( member && !member.roles.find( rl => rl.id === roleid ) )
  {
    member.addRole( roleid )
      .then( () => {
        debug( 'Added role ' + role + ' to member ' + member.displayName );
        if( message )
        {
          message.reply( properties.roles[role].message
            .replace( /\{roleName\}/g, roleName ) );
        }
      })
      .catch( error );
    }
}

/**
 * Repopulate the properties from the setting file originally passed in.
 */
function refreshProperties()
{
  debug( 'Refreshing properties' );
  properties = getJSON( propFile );
  meetingTimeout = initMeetingChecker();
}

/**
 * Initialize the meeting interval checker.
 * return Timeout The timeout object the interval is running in.
 */
function initMeetingChecker()
{
  clearInterval( meetingTimeout );
  return setInterval( () =>
  {
    // Get the current date and the meeting object.
    let now = new Date();
    let meeting = properties.meeting;

    // Check for day before the meeting.
    if( now.getDay() === ( meeting.day + 6 ) % 7 )
    {
      let hour = parseInt( meeting.time.split(':')[0] );
      // Check to see if we're 24h before the meeting.
      if( now.getHours() === hour )
      {
        let minute = parseInt( meeting.time.split(':')[1] );
        // Check to see if we're at the same time as the meeting.
        if( now.getMinutes() === minute )
        {
          // Send the meeting reminder message.
          debug( 'Meeting notice!' );
          const channel = client.channels
            .find( ch => ch.name === properties.meeting.channel );
          channel.send( properties.meeting.message );
        }
      }
    }
  }, properties.meeting.interval * 1000 );
}

/**
 * Outputs the given message if debug is enabled.
 */
function debug( msg )
{
  if( properties.debug )
  {
    logger.log( getTimestamp() + ' ' );
    logger.log( msg );
  }
}

/**
 * Output an error.
**/
function error( obj )
{
  logger.error( obj );
}

/**
 * Get the timestamp for logging output.
**/
function getTimestamp()
{
  let date = new Date();
  let timestamp = `[${date.getFullYear()}/${padZero(date.getMonth() + 1)}/${padZero(date.getDate())}-${padZero(date.getHours())}:${padZero(date.getMinutes())}:${date.getSeconds()}.${date.getMilliseconds()}]`;

  function padZero( thing )
  {
    return thing.toString().padStart(2,'0')
  }

  return timestamp;
}

/**
 * Read the properties from a given file or default.
 */
function getJSON( file = './bot.json' )
{
  let data;
  try {
    data = JSON.parse( fs.readFileSync( file, 'utf8' ) );

    logger = getLogger( data );

    if ( data.debug )
    {
      logger.log( 'Loaded properties from file' );
    }
  } catch (e) {
    console.error( 'Could not find file specified: ' + file );
    console.error( e );
    process.exit( 1 );
  }

  return data;
}

/**
 * Get the logger, which is set up either to use stdout/err or can be configured
 * in the JSON setup file.
**/
function getLogger( data )
{
  let debug = data.debugFile;
  let error = data.errorFile;

  const output = debug ? fs.createWriteStream( debug, {flags:'a'} ) : process.stdout;
  const errorOutput = error ? fs.createWriteStream( error, {flags:'a'} ) : process.stderr;

  return new Console({ stdout: output, stderr: errorOutput });
}

/**
 * Set the bots activity to 'type name'.
 **/
function setActivity( name, type )
{
  if( ['watching', 'streaming', 'playing', 'listening'].includes( type.toLowerCase() ) )
  {
    client.user.setActivity( name, {type: type.toUpperCase()} )
      .then( presence => debug(`Set activity to ${type} ${name}.`) )
      .catch( error );
  }
}
