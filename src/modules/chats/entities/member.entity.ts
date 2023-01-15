import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  JoinColumn,
  BaseEntity,
} from 'typeorm';
import { Expert } from './expert.entity';
import { RoomChat } from './room-chat.entity';
import { Exclude } from 'class-transformer';

@Entity('ape_members')
export class Member extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  phone_number: string;

  @Column()
  social_facebook_id: string;

  @Column()
  username: string;

  @Column()
  full_name: string;

  @Column()
  email: string;

  @Column()
  country_code: string;

  @Column()
  gender: number;

  @Column()
  birthday: string;

  @Column()
  avatar: string;

  @Exclude()
  @Column()
  token: string;

  @Exclude()
  @Column()
  created_token: string;

  @Column()
  is_verify: string;

  @Column()
  status: string;

  /**
   * Relation: Experts
   */
  @OneToMany((type) => Expert, (expert) => expert.member)
  @JoinColumn({ name: 'member_id' })
  experts: Expert[];

  /**
   * Relation: RoomChats
   */
  @OneToMany((type) => RoomChat, (room_chat) => room_chat.member)
  @JoinColumn({ name: 'member_id' })
  room_chats: RoomChat[];
}
