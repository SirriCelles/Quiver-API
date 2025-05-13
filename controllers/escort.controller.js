import Escort from '../models/escort.model.js';
import { getAllResource, getResource } from './handleFactory.js';

export const getAllEscorts = getAllResource(Escort);

export const getEscortById = getResource(Escort);
