This is an example application showing how to integrate Chatra in your applications.

It features 3 modules:

1. The **server** is in charge of listening to new message webhook and sending the messages to the admin panel. It also handles the interaction with the Chatra API to reply to messages.
2. The **admin panel** listens to the server's SSE stream for new messages from the client. It also posts
   replies to an endpoint in our server.
3. The **client** mounts the Chatra widget to communicate with an agent. It is oblivious to both the server and the admin panel.
