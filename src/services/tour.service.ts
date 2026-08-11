import apiClient from '@/lib/api-client';
import type { TourId } from '@/types/tour.types';

export async function marcarTourCompleto(tourId: TourId): Promise<void> {
  await apiClient.patch('/usuarios/me/tours', { tourId });
}
