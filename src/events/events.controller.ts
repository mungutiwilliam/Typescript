import { Body, Controller, Delete, Get, HttpCode, Logger, NotFoundException, Param, ParseIntPipe, Patch, Post, ValidationPipe } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Like, MoreThan, Repository } from "typeorm";
import { CreateEventDto } from "./create-event.dto";
import { Event } from "./event.entity";
import { UpdateEventDto } from "./update-event.dto";


@Controller('/events')
export class EventsController {
    private readonly logger = new Logger(EventsController.name);
    // logger contains three log levels : debug, warning and error 

   constructor(

    // argument for the repository class is the entity object that will be used by the repository 
    @InjectRepository(Event)
    private readonly repository : Repository<Event>
   ){}



    @Get()
    // find all will return a list
    
    async findAll(){
         // the logger class will show when the find all method is reached
        this.logger.log('Hit the findAll route ');
        const events = await this.repository.find();
        this.logger.debug(`Found ${events.length} events`)
        return events
    }

    @Get('/practice')
    // practice stands for the route to be used
    async practice (){
        return await this.repository.find({
            select:['id','when'],
            where: [{ id : MoreThan(3),
            when: MoreThan(new Date('2021-02-12T13:00:00')) 
        }, {
            description: Like('%meet%')
        }],
        take:2,
        order: {
            id: 'DESC'
        }
        });
    } 

    @Get(':id')
    // not including the parameter value in the @Param() function, the return value will have a kep value pair returned from the client side
    // the expected return will be  "id" : "id_value" else the return will ve just the value by itself
    async findOne (@Param('id', ParseIntPipe) id: number) {
        
        // the result of the findOne will naturally be returned by the code
        const event = await this.repository.findOne({where: {id:id}});
        
        // when the event is not obtained, the error exception will be thrown
        if(!event){
            throw new NotFoundException();
        }
        
        return event;
    }

    @Post()
    // createEventDto is the predefined payload that nestjs will be expecting from the body
    // its contents have been defined in the 'create-events-dto.ts' file
    // the ValidationPipe enables the data coming in as the body to be validated  
    async create(
        // this is local validation ->   new ValidationPipe({groups:['create']})
        @Body() new_data: CreateEventDto) {

        return await this.repository.save({
            ... new_data,
            when: new Date(new_data.when),
        });
    }


    @Patch(':id')
    async update(
        @Param('id', ParseIntPipe) id:number , 
        // this is local validation ->   new ValidationPipe({groups:['update']})
        
        @Body() new_data: UpdateEventDto ) {
        // the UpdateEventDto now has all variables as optional
        // all properties are being extended from the CreateEventDto 
        new_data.address
        new_data.description

        const event = await this.repository.findOne({where: { id:id }});

        if(!event){
            throw new NotFoundException();
        }
         
        return await this.repository.save({
            ...event,
            ... new_data,
            when: new_data.when? new Date(new_data.when) : event.when

        });
    }

    @Delete(':id')
    @HttpCode(204)
    async remove(
        @Param('id', ParseIntPipe) id:number) { 
        const event = await this.repository.findOne({ where:{ id:id }});
        if(!event){
            throw new NotFoundException();
        }

        await this.repository.remove(event);

    }
}