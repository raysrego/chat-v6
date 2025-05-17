const QRCode = require('qrcode'); 
// Exemplo de geração de QR com bom contraste e margens
const QRCode = require('qrcode');

// Substitua 'https://exemplo.com' pelo seu conteúdo real
QRCode.toFile('qrcode.png', 'https://exemplo.com', (err) => {
  if (err) {
    console.error('Erro ao gerar QR code:', err);
    return;
  }
  console.log('QR code salvo em qrcode.png');
});
const { Client } = require('whatsapp-web.js');

// Configuração do cliente
const client = new Client({
    puppeteer: { 
        headless: true,
        args: ['--no-sandbox']
    }
});

// Dados da clínica
const clinicInfo = {
    name: "INCOM – Instituto de Coluna e Ortopedia do Maranhão",
    address: "Medical Jaracaty – 12º andar, salas 1201 e 1207",
    hours: "segunda a sexta, das 08h às 17h30",
    website: "www.incom-slz.com.br",
    price: 400
};

// Convênios aceitos
const acceptedInsurances = [
    "AERONÁUTICA", "AMIL", "ASSEFAZ", "CAMED", "CASF", 
    "CASSI", "CAPESAUDE", "CENTRAL NACIONAL UNIMED", "CONAB", 
    "E-VIDA", "GEAP", "MEDISERVICE", "POSTAL SAÚDE", 
    "SAÚDE BRADESCO", "SAÚDE CAIXA", "SULAMERICA", 
    "UNIMED SEGUROS", "VALE E PASA", "VERITAS"
];

// Médicos e links de agendamento
const doctors = {
    "Dr. Alexandre Seabra": "https://form.jotform.com/232425024015643",
    "Dr. Antônio Carlos": "https://form.jotform.com/221144267617656",
    "Dr. Átylla Cândido": "https://form.jotform.com/221143965080654",
    "Dr. Carlos Eduardo": "https://form.jotform.com/233104976724661",
    "Dr. Elcione Dantas": "https://form.jotform.com/221426532488660",
    "Dr. Gilmar Freitas": "https://form.jotform.com/230174268245657",
    "Dr. Ícaro Silva": "https://form.jotform.com/221426133963049",
    "Dra. Itamara Souza": "https://form.jotform.com/250064641953658",
    "Dr. Josemith": "https://incom.agendamento.com/dr-josemith",
    "Dr. Leonardo Oliveira": "https://form.jotform.com/221426362438656",
    "Dr. Sebastião Morais": "https://form.jotform.com/233105385677057"
};

// Especialidades e dias disponíveis
const specialtiesSchedule = {
    "Coluna": {
        days: {
            "Segunda": "Manhã",
            "Quarta": "Manhã e Tarde",
            "Sexta": "Tarde"
        }
    },
    "Joelho": {
        days: {
            "Terça": "Manhã",
            "Quinta": "Tarde"
        }
    },
    "Quadril": {
        days: {
            "Terça": "Manhã",
            "Quarta": "Manhã",
            "Quinta": "Tarde",
            "Sexta": "Tarde"
        }
    },
    "Ombro e Cotovelo": {
        days: {
            "Terça": "Manhã e Tarde",
            "Quinta": "Manhã"
        }
    },
    "Pé e Tornozelo": {
        days: {
            "Quarta": "Manhã"
        }
    },
    "Mão": {
        days: {
            "Segunda": "Tarde",
            "Quarta": "Manhã",
            "Sexta": "Manhã"
        }
    },
    "Medicina da Dor": {
        days: {
            "Quarta": "Tarde"
        }
    }
};

// Adicione esta função no início do seu código (após as declarações de constantes)
function getCurrentStatus() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
    
    let statusMessage = '';
    
    // Verifica se é final de semana
    if (day === 0 || day === 6) {
        statusMessage = `ℹ️ *Atenção:* Nosso horário de funcionamento é de segunda a sexta, das 8h às 17h30.\n` +
                      `Mas fique tranquilo! Você pode agendar sua consulta pelo site: ${clinicInfo.website}`;
    } 
    // Verifica se é horário de almoço
    else if (hour >= 12 && hour < 13) {
        statusMessage = 'ℹ️ *Atenção:* Estamos em horário de almoço (12:00 às 13:00).\n' +
                      'Responderemos sua mensagem assim que retornarmos.';
    }
    
    return statusMessage;
}

// Estados dos usuários
const userStates = {};

// Geração do QR Code
client.on('qr', qr => {
    console.log('Escaneie este QR Code com seu WhatsApp:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Bot conectado com sucesso!');
    
    // Mantém a conexão ativa
    setInterval(async () => {
        try {
            await client.sendPresenceUpdate('available');
            console.log('[MANUTENÇÃO] Presença atualizada');
        } catch (e) {
            console.error('[ERRO] Ao atualizar presença:', e);
        }
    }, 20 * 60 * 1000); // 20 minutos
});

// Recuperação de desconexão
client.on('disconnected', async (reason) => {
    console.log(`Desconectado: ${reason}`);
    console.log('Tentando reconectar...');
    await client.destroy();
    client.initialize();
});

// Função para enviar mensagem de boas-vindas (ATUALIZADA)
async function sendWelcome(chat, userId) {
    const statusMessage = getCurrentStatus();
    
    // Se for final de semana, mostra apenas a mensagem de fechado
    if (statusMessage) {
        await chat.sendMessage(statusMessage);
        return; // Não mostra o menu principal
    }
    
    // Se for dia útil, mostra o menu normal
    userStates[userId] = { step: 'main_menu' };
    let message = `Olá! 👋 Bem-vindo ao ${clinicInfo.name}\n\n` +
               `*Como posso ajudar?*\n\n` +
               `1️⃣ Agendar consulta\n` +
               `2️⃣ Valor da consulta\n` +
               `3️⃣ Convênios aceitos\n` +
               `4️⃣ Falar com atendente\n` +
               `5️⃣ Acessar site`;
    
    await chat.sendMessage(message);
}

// Adicione esta verificação no início do handler de mensagens
client.on('message', async msg => {
    if (msg.fromMe || !msg.from.endsWith('@c.us')) return;

    const chat = await msg.getChat();
    const contact = await msg.getContact();
    const userId = contact.id.user;
    const text = msg.body.toLowerCase().trim();
    const now = new Date();
    const day = now.getDay();


    // Restante do seu código existente...
});


// Função para mostrar valor da consulta
async function showConsultationPrice(chat, userId) {
    userStates[userId] = { step: 'consultation_price' };
    await chat.sendMessage(`*Valor da consulta:*\n\n` +
                          `💵 Particular: R$${clinicInfo.price},00\n` +
                            `💳 Aceitamos: Pix, Débito, Crédito e Espécie.\n\n` +
                          '*Com direito a 20 dias para retorno*\n\n' +
                          `6️⃣ Voltar ao menu principal`);
}

// Função para listar convênios
async function listInsurances(chat, userId) {
    userStates[userId] = { step: 'insurances' };
    let message = `*Convênios Aceitos:*\n\n`;
    message += acceptedInsurances.join("\n");
    message += `\n\n6️⃣ Voltar ao menu principal`;
    await chat.sendMessage(message);
}

// Função para mostrar opções de agendamento
async function showAppointmentOptions(chat, userId) {
    userStates[userId] = { step: 'appointment_type' };
    await chat.sendMessage(`*Como deseja agendar?*\n\n` +
                          `1️⃣ Por médico específico\n` +
                          `2️⃣ Por especialidade\n\n` +
                          `6️⃣ Voltar ao menu principal`);
}

// Função para listar médicos
async function listDoctors(chat, userId) {
    userStates[userId] = { step: 'select_doctor' };
    let message = `*Selecione o médico:*\n\n`;
    Object.keys(doctors).forEach((doctor, index) => {
        message += `${index + 1} - ${doctor}\n`;
    });
    message += `\n6️⃣ Voltar ao menu principal`;
    await chat.sendMessage(message);
}

// Função para listar especialidades
async function listSpecialties(chat, userId) {
    userStates[userId] = { step: 'select_specialty' };
    let message = `*Selecione a especialidade:*\n\n`;
    Object.keys(specialtiesSchedule).forEach((spec, index) => {
        message += `${index + 1} - ${spec}\n`;
    });
    message += `\n6️⃣ Voltar ao menu principal`;
    await chat.sendMessage(message);
}

// Função para mostrar dias disponíveis de uma especialidade
async function showSpecialtyDays(chat, userId, specialty) {
    userStates[userId] = { 
        step: 'select_day',
        specialty: specialty
    };
    
    const days = specialtiesSchedule[specialty].days;
    let message = `*Dias disponíveis para ${specialty}:*\n\n`;
    
    Object.keys(days).forEach((day, index) => {
        message += `${index + 1} - ${day}: ${days[day]}\n`;
    });
    
    message += `\n6️⃣ Voltar ao menu principal`;
    await chat.sendMessage(message);
}

// Fluxo principal de mensagens
client.on('message', async msg => {
    if (msg.fromMe || !msg.from.endsWith('@c.us')) return;

    const chat = await msg.getChat();
    const contact = await msg.getContact();
    const userId = contact.id.user;
    const text = msg.body.toLowerCase().trim();

    // Inicializa estado do usuário se não existir
    if (!userStates[userId]) {
        userStates[userId] = { step: 'main_menu' };
    }
    const userState = userStates[userId];

    try {
        // Verifica se é para voltar ao menu principal
        if (text === '6' || text.includes('voltar')) {
            await sendWelcome(chat, userId);
            return;
        }

        // Resposta a saudações
        if (/^(oi|olá|menu|boa noite|bom dia|boa tarde|oie|Ei|iniciar)/i.test(text)) {
            await sendWelcome(chat, userId);
            return;
        }

        // Fluxo baseado no estado atual
        switch (userState.step) {
            case 'main_menu':
                if (text === '1' || text.includes('agendar')) {
                    await showAppointmentOptions(chat, userId);
                } 
                else if (text === '2' || text.includes('valor')) {
                    await showConsultationPrice(chat, userId);
                }
                else if (text === '3' || text.includes('convênio')) {
                    await listInsurances(chat, userId);
                }
                else if (text === '4' || text.includes('atendente')) {
                    await chat.sendMessage("Aguarde um momento, vou transferir para um atendente...");
                }
                else if (text === '5' || text.includes('site')) {
                    await chat.sendMessage(`Faça seu agendamento de forma simples e rápida acessando nosso site: ${clinicInfo.website}`);
                }
                 if (text === 'menu' || text.includes('voltar')) {
            await sendWelcome(chat, userId);
            
        }
               

            case 'consultation_price':
                await sendWelcome(chat, userId);
                break;

            case 'insurances':
                await sendWelcome(chat, userId);
                break;

            case 'appointment_type':
                if (text === '1' || text.includes('médico')) {
                    await listDoctors(chat, userId);
                } 
                else if (text === '2' || text.includes('especialidade')) {
                    await listSpecialties(chat, userId);
                }
                else {
                    await chat.sendMessage("Opção inválida. Por favor, digite 1 ou 2.");
                }
                break;

            case 'select_doctor':
                const doctorIndex = parseInt(text) - 1;
                const doctorNames = Object.keys(doctors);
                
                if (doctorIndex >= 0 && doctorIndex < doctorNames.length) {
                    const doctorName = doctorNames[doctorIndex];
                    await chat.sendMessage(`*Agendamento com ${doctorName}:*\n${doctors[doctorName]}\n\n` +
                                         `Clique no link acima para fazer o agendamento com o médico desejado.`);
                    await sendWelcome(chat, userId);
                } else {
                    await chat.sendMessage("Número inválido. Por favor, tente novamente.");
                }
                break;

            case 'select_specialty':
                const specIndex = parseInt(text) - 1;
                const specialtyNames = Object.keys(specialtiesSchedule);
                
                if (specIndex >= 0 && specIndex < specialtyNames.length) {
                    const specialty = specialtyNames[specIndex];
                    await showSpecialtyDays(chat, userId, specialty);
                } else {
                    await chat.sendMessage("Número inválido. Por favor, tente novamente.");
                }
                break;

            case 'select_day':
                const dayIndex = parseInt(text) - 1;
                const specialty = userState.specialty;
                const days = Object.keys(specialtiesSchedule[specialty].days);
                
                if (dayIndex >= 0 && dayIndex < days.length) {
                    const selectedDay = days[dayIndex];
                    await chat.sendMessage(`Você selecionou ${specialty} na ${selectedDay}.\n\n` +
                                         `Por favor, nos informe:\n` +
                                         `- Seu nome completo\n` +
                                         `- Telefone para contato\n` +
                                         `- Retorno ou consulta\n` +
                                         `- Presencial ou online\n` +
                                         `- Forma de atendimento (Particular/Convênio)\n\n` +
                                         `6️⃣ Voltar ao menu principal`);
                    userState.step = 'collect_data';
                    userState.appointmentDetails = {
                        specialty: specialty,
                        day: selectedDay
                    };
                } else {
                    await chat.sendMessage("Número inválido. Por favor, tente novamente.");
                }
                break;

            case 'collect_data':
                if (text.split('\n').length >= 3) {
                    const [name, phone, payment] = text.split('\n');
                    await chat.sendMessage(`✅ Agendamento solicitado!\n\n` +
                                         `Especialidade: ${userState.appointmentDetails.specialty}\n` +
                                         `Dia: ${userState.appointmentDetails.day}\n` +
                                         `Nome: ${name}\n` +
                                         `Telefone: ${phone}\n` +
                                         `Pagamento: ${payment}\n\n` +
                                         `Aguarde a confirmação do seu agendamento.`);
                    await sendWelcome(chat, userId);
                } else {
                    await chat.sendMessage("Por favor, informe todos os dados solicitados.");
                }
                break;

            default:
                await chat.sendMessage("Posso ajudar em algo mais?");
                
        }
    } catch (error) {
        console.error('Erro:', error);
        await chat.sendMessage("Ocorreu um erro. Por favor, tente novamente.");
        await sendWelcome(chat, userId);
    }
});

// Tratamento de erros
client.on('auth_failure', () => console.error('Falha na autenticação'));
client.on('disconnected', () => console.error('Desconectado'));

// Inicialização
client.initialize();
