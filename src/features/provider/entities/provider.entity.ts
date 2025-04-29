import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity('providers')
export class Provider {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'jsonb' })
    weeklySchedule: Record<string, { start: string; end: string }>;

    @Column({ type: 'int', default: 30 })
    appointmentDuration: number;

    @Column()
    timezone: string;
}
