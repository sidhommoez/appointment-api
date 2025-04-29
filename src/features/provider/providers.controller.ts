import { Controller, Post, Get, Param, Body, Query } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import {ProviderIdParamDto} from "./dto/provider-id-param.dto";
import {AvailabilityDateDto} from "./dto/get-availability-date.dto";

@ApiTags('Providers')
@Controller('api/providers')
export class ProvidersController {
    constructor(private readonly providersService: ProvidersService) {}

    @Post(':providerId/schedule')
    @ApiOperation({ summary: 'Add or Update Provider Schedule' })
    @ApiParam({ name: 'providerId', required: true, type: String })
    @ApiResponse({ status: 200, description: 'Provider schedule updated successfully.' })
    async updateSchedule(
        @Param() updateScheduleParams: ProviderIdParamDto,
        @Body() schedulingBodyDto: CreateScheduleDto,
    ) {
        return this.providersService.upsertSchedule(updateScheduleParams, schedulingBodyDto);
    }

    @Get(':providerId/availability')
    @ApiOperation({ summary: 'Check Provider Availability' })
    @ApiParam({ name: 'providerId', required: true, type: String })
    @ApiResponse({ status: 200, description: 'Provider schedule updated successfully.' })
    @ApiQuery({ name: 'date',type: String ,required: true, description: 'Date to check availability (YYYY-MM-DD)' })
    @ApiResponse({ status: 200, description: 'Available time slots returned.' })
    async checkAvailability(
        @Param() getAvailabilityParams: ProviderIdParamDto,
        @Query() getAvailabilityQueries: AvailabilityDateDto,
    ) {
        console.log(getAvailabilityParams)
        return this.providersService.getAvailability(getAvailabilityParams, getAvailabilityQueries);
    }
}
