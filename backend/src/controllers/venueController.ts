import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { Venue } from '../models/Venue';
import { NotFoundError } from '../utils/errors';

export const venueValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('country').trim().notEmpty().withMessage('Country is required'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
];

export async function listVenues(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const venues = await Venue.find().sort({ name: 1 });
    res.json({ status: 'success', data: { venues } });
  } catch (err) {
    next(err);
  }
}

export async function createVenue(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const venue = await Venue.create(req.body);
    res.status(201).json({ status: 'success', data: { venue } });
  } catch (err) {
    next(err);
  }
}

export async function getVenue(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) return next(new NotFoundError('Venue'));
    res.json({ status: 'success', data: { venue } });
  } catch (err) {
    next(err);
  }
}
