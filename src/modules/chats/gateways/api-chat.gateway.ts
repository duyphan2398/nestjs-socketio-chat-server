import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage,
} from '@nestjs/websockets';
import {
    ClassSerializerInterceptor,
    Inject, Logger,
    UnauthorizedException, UseInterceptors,
} from '@nestjs/common';
import {Socket, Server} from 'socket.io';
import {MembersService} from "../services/members.service";
import {RoomChatsService} from "../services/room-chats.service";
import {ConnectedMembersService} from "../services/connected-members.service";

@WebSocketGateway({
    namespace: 'api-chat',
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
})
export class ApiChatGateway
    implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    constructor(
        @Inject(MembersService) private readonly membersService: MembersService,
        @Inject(ConnectedMembersService) private readonly connectedMemberService: ConnectedMembersService,
        @Inject(RoomChatsService) private readonly roomChatsService: RoomChatsService,
    ) {
    }

    async handleConnection(socket: Socket) {
        const token = socket.handshake.headers.authorization || ''
        try {
            const member = await this.membersService.verifyToken(token);
            socket.data.member = member;
            const rooms = await this.roomChatsService.getListRoomChatByMemberId(member.id, { page: 1, limit: 10 });

            await this.connectedMemberService.save({connected_id: socket.id, member_id: member.id});

            return socket.emit('load-rooms', rooms);
        } catch (exception) {
            return this.disconnect(socket, exception);
        }
    }


    private disconnect(socket: Socket, exception) {
        socket.emit('throw-exception', exception.message || 'Something went wrong in server');
        socket.disconnect();
    }


    async handleDisconnect(socket: Socket) {
        // remove connection from DB
        await this.connectedMemberService.deleteByConnectedId(socket.id);
        socket.disconnect();
    }

    @SubscribeMessage('createRoom')
    async onCreateRoom(socket: Socket, room) {
        const createdRoom: RoomI = await this.roomChatsService.create(room, socket.data.user);

        for (const user of createdRoom.users) {
            const connections: ConnectedUserI[] = await this.connectedUserService.findByUser(user);
            const rooms = await this.roomService.getRoomsForUser(user.id, { page: 1, limit: 10 });
            // substract page -1 to match the angular material paginator
            rooms.meta.currentPage = rooms.meta.currentPage - 1;
            for (const connection of connections) {
                await this.server.to(connection.socketId).emit('rooms', rooms);
            }
        }
    }

}