const TelegramBot = require('node-telegram-bot-api');
const UsedEmail = require('../models/UsedEmail');  // Importa el modelo correctamente
const correosUsados = require('../models/correosUsados');  // Importa el modelo correctamente
const db = require('../db.js');

const token = "7233736873:AAGsDEqN0tpy2SRFPB23Bd13QqYiLkK2-v0";
const bot = new TelegramBot(token, { polling: true });

const channels = [
  { id: '-1002007887417', name: 'Sharpods Club 💎 💎' },
  { id: '-1001679093288', name: 'Bot de goles Bet Live 💎' },
  { id: '-1001538116034', name: 'Bot de itinerarios Bet Live 💎' },
  { id: '-1001587405522', name: 'Bot de corners Bet Live' }
];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const userStates = {};
db();

const handleEmailValidation = async (chatId, text) => {
  if (emailRegex.test(text)) {
    try {
      // Verificar si el correo ya ha sido usado
      const usedEmail = await correosUsados.findOne({ email: text });
      if (usedEmail) {
        await bot.sendMessage(chatId, 'Este correo ya ha sido usado. Por favor, usa otro correo electrónico.');
        return;
      }

      const userEmail = await UsedEmail.findOne({ email: text });
      if (userEmail && userEmail.isActive) {
        // Crear los botones para todos los canales
        const buttons = [];

        for (const channel of channels) {
          // Crear una invitación de un solo uso para cada canal
          const inviteLink = await bot.createChatInviteLink(channel.id, {
            member_limit: 1
          });
          buttons.push([{ text: `Unirse a ${channel.name}`, url: inviteLink.invite_link }]);
        }

        // Enviar todos los botones en un solo mensaje
        await bot.sendMessage(chatId, 'Gracias por enviar tu correo. Aquí están tus invitaciones para los canales:', {
          reply_markup: {
            inline_keyboard: buttons
          }
        });

        // Mensajes adicionales después de enviar los enlaces
        await bot.sendMessage(chatId, 'Gracias por tu compra.');
        await bot.sendMessage(chatId, 'Espero que tengas buena suerte en tus inversiones deportivas.');

        // Guardar el correo en la base de datos
        const newUsedEmail = new correosUsados({ email: text });
        await newUsedEmail.save();
      } else {
        await bot.sendMessage(chatId, 'No hemos encontrado tu suscripción activa. Por favor verifica tu correo e intenta nuevamente.');
      }
    } catch (err) {
      console.log(`Error al verificar el correo: ${err}`);
      await bot.sendMessage(chatId, 'Ocurrió un error al verificar tu correo. Por favor intenta nuevamente más tarde.');
    }
    // Reset user state after processing email
    userStates[chatId] = 'waiting_for_welcome';
  } else {
    // Handle invalid email
    await bot.sendMessage(chatId, 'Solo puedo recibir correos electrónicos. Por favor, envía un correo electrónico válido.');
  }
};

const welcomeUser = () => {
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Verificar si el mensaje proviene de un usuario individual
    if (msg.chat.type === 'private') {
      if (!userStates[chatId] || userStates[chatId] === 'waiting_for_welcome') {
        // Enviar mensaje de bienvenida si este es el primer mensaje o después de la validación del correo
        await bot.sendMessage(chatId, 'Bienvenido a los canales, espero que tengas suerte en tu inversión deportiva');
        await bot.sendMessage(chatId, 'Por favor, envía tu email de usuario de Sharpods para verificar tu suscripción');

        // Establecer el estado del usuario a esperando el correo electrónico
        userStates[chatId] = 'waiting_for_email';
      } else if (userStates[chatId] === 'waiting_for_email') {
        // Validar el correo electrónico si el estado del usuario es esperando el correo electrónico
        await handleEmailValidation(chatId, text);
      }
    } else {
      console.log(`Mensaje recibido de un chat de tipo: ${msg.chat.type}. Ignorando...`);
    }
  });
};

welcomeUser();

const unbanChatMember = (userId) => {
  for (const channel of channels) {
    bot.unbanChatMember(channel.id, userId)
      .then(() => {
        console.log(`User unbanned from the channel ${channel.name}`);
      })
      .catch(err => console.log(`Error to unban user from ${channel.name}: ${err}`));
  }
};

const kickChatMember = (userId) => {
  for (const channel of channels) {
    bot.banChatMember(channel.id, userId)
      .then(() => {
        console.log(`User kicked from the channel ${channel.name}`);
      })
      .catch(err => console.log(`Error to kick user from ${channel.name}: ${err}`));
  }
};
