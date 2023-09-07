import 'dotenv/config';
import { WebSocket } from 'ws';
import webpush from 'web-push';


const BLOCK_HEIGHT = 100583000;
const QUERY_API_ENDPOINT = 'near-queryapi.api.pagoda.co';

const pushSubscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/dhE9s2hbc0k:APA91bHXGUI-QcRxs2U538xJmH5KfJhHKK1AX1tqy-F59EukXTWHYcJ9Q8nQOdfW0UqSxYTzo6nWAl9-CMXYmWpqJTWMRkXW2Ldmu_EUJ7RwAFlY7X27OPTY5B8ll7xWS44_PFGwmTkc',
  expirationTime: null,
  keys: {
    p256dh: 'BAUqHS9W-rBpidvUsu4oFLppebMc6Zqq6VZFmGjjxPMdSZQ-RHlguXItCoEIrdAXqE_ru9vGAKKX8BXsl5rTFac',
    auth: 'QD7XeTtJ5Q6whsRToM0K3Q'
  }
}

webpush.setVapidDetails(
  'mailto:milena@near.org',
  "BCZN5uqYMBZ2VCV3y0F0emodyYRGyt5JTgfIIzYVXIHKSBwuG0kb0NpPA-DM4nfmfRFiFu-MpKS2eNG7bhxQWn0",
  "f1qlHM-Wsq9m6Z_WwQPPGL4zHyS2fKCoZFXOu2n5Dao"
);



// *** Query API subscription - DO NOT CHANGE
const notificationsSubscriptionQuery = `
subscription Notifications {
  charleslavon_near_n0_notifications(where: 
    { blockHeight: { _gt: ${BLOCK_HEIGHT} } }) {
    id
    blockHeight
    initiatedBy
    itemType
    message
    path
    receiver
    valueType
  }
}
`;

const notificationsSubscription = {
  type: 'start',
  id: 'notifications',
  payload: {
    operationName: 'Notifications',
    query: notificationsSubscriptionQuery,
    variables: {},
  },
};
const ws = new WebSocket(`wss://${QUERY_API_ENDPOINT}/v1/graphql`, 'graphql-ws');

// *** Query API subscription - END


ws.onopen = () => {
  console.log(`Connection to WS has been established`);
  ws.send(
    JSON.stringify({
      type: 'connection_init',
      payload: {
        headers: {
          'Content-Type': 'application/json',
          'Hasura-Client-Name': 'hasura-console',
          'x-hasura-role': 'charleslavon_near',
        },
        lazy: true,
      },
    }),
  );

  setTimeout(() => ws.send(JSON.stringify(notificationsSubscription)), 50);
};

ws.onclose = (e) => {
  console.log(`WS Connection has been closed, reason: ` + e.code);
};

ws.onmessage = (e) => {
  const data = JSON.parse(e.data);
  if (data.payload?.errors) {
    console.log('Errors', data.payload.errors);
  } else if (data.id == 'notifications' && data.payload?.data?.charleslavon_near_n0_notifications) {
    const messages = data.payload?.data?.charleslavon_near_n0_notifications;
    console.log('Received data', messages);

    if (messages.length > 0) {
      messages.forEach( (message) => {
        console.log('Publishing message', message);
        webpush.sendNotification(pushSubscription, JSON.stringify(message)).then(res => {
          console.log(res);
        });
        console.log('Message published');

      });
    }
  }
};

ws.onerror = (err) => {
  console.log('WebSocket error', err);
};
