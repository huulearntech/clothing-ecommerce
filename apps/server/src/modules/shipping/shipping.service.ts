import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AbstractShippingCarrier,
  ShippingRateResponse,
  ShipmentResult,
  TrackingInfo,
} from './interfaces/shipping-carrier.interface';
import { ShippingZone } from './entities/shipping-zone.entity';
import { ShippingMethod } from './entities/shipping-method.entity';
import { Shipment } from '../orders/entities/shipment.entity';
import { CalculateRatesDto } from './dto/calculate-rates.dto';
import { CreateShippingZoneDto } from './dto/create-shipping-zone.dto';
import { CreateShippingMethodDto } from './dto/create-shipping-method.dto';
import { ShipmentStatus } from '../../common/enums/index';

@Injectable()
export class ShippingService {
  constructor(
    @Inject('SHIPPING_CARRIER')
    private readonly carrier: AbstractShippingCarrier,
    @InjectRepository(ShippingZone)
    private readonly zoneRepo: Repository<ShippingZone>,
    @InjectRepository(ShippingMethod)
    private readonly methodRepo: Repository<ShippingMethod>,
    @InjectRepository(Shipment)
    private readonly shipmentRepo: Repository<Shipment>,
  ) {}

  async getRates(calculateRatesDto: CalculateRatesDto): Promise<ShippingRateResponse[]> {
    const carrierRates = await this.carrier.calculateRate(calculateRatesDto);

    // Complement with active DB shipping zone & method rules
    const country = calculateRatesDto.destinationAddress.country;
    const matchingZone = await this.zoneRepo
      .createQueryBuilder('zone')
      .leftJoinAndSelect('zone.methods', 'method')
      .where('zone.isActive = true')
      .andWhere(':country = ANY(zone.countries) OR ARRAY_LENGTH(zone.countries, 1) IS NULL', { country })
      .getOne();

    const dbRates: ShippingRateResponse[] = [];
    if (matchingZone && matchingZone.methods) {
      for (const m of matchingZone.methods) {
        if (!m.isActive) continue;
        const weightCost = Number(m.costPerKg || 0) * (calculateRatesDto.weightInKg || 1);
        const totalCost = Number(m.baseCost) + weightCost;

        dbRates.push({
          carrierName: m.carrierCode ? m.carrierCode.toUpperCase() : 'Internal Zone Rate',
          serviceName: m.name,
          serviceCode: `DB_${m.id.slice(0, 8)}`,
          cost: Number(totalCost.toFixed(2)),
          estimatedDays: m.estimatedDays,
        });
      }
    }

    return [...carrierRates, ...dbRates];
  }

  async processFulfillment(orderId: string, shippingAddress: any, weightInKg = 1.5): Promise<Shipment> {
    const result: ShipmentResult = await this.carrier.createShipment({
      orderId,
      destinationAddress: shippingAddress,
      weightInKg,
    });

    const shipment = this.shipmentRepo.create({
      orderId,
      carrier: result.carrierName,
      trackingNumber: result.trackingNumber,
      status: ShipmentStatus.LABEL_CREATED,
      shippedAt: new Date(),
    });

    return this.shipmentRepo.save(shipment);
  }

  async trackShipment(trackingNumber: string): Promise<TrackingInfo> {
    return this.carrier.trackShipment(trackingNumber);
  }

  // Zone Management
  async createZone(dto: CreateShippingZoneDto): Promise<ShippingZone> {
    const zone = this.zoneRepo.create(dto);
    return this.zoneRepo.save(zone);
  }

  async getAllZones(): Promise<ShippingZone[]> {
    return this.zoneRepo.find({ relations: { methods: true } });
  }

  // Method Management
  async createMethod(dto: CreateShippingMethodDto): Promise<ShippingMethod> {
    const zone = await this.zoneRepo.findOne({ where: { id: dto.zoneId } });
    if (!zone) {
      throw new NotFoundException(`Shipping zone '${dto.zoneId}' not found`);
    }

    const method = this.methodRepo.create(dto);
    return this.methodRepo.save(method);
  }

  async getShipmentsByOrder(orderId: string): Promise<Shipment[]> {
    return this.shipmentRepo.find({
      where: { orderId },
      order: { shippedAt: 'DESC' },
    });
  }
}
