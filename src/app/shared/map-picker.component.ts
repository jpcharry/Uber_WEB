import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonSegment, IonSegmentButton, IonLabel } from '@ionic/angular';
import * as L from 'leaflet';
import { Coordinates } from '../core/models';

@Component({
  selector: 'app-map-picker',
  standalone: true,
  imports: [CommonModule, IonSegment, IonSegmentButton, IonLabel],
  template: `
    <div class="map-head"><strong>Selecciona los puntos en el mapa</strong><span>Haz clic para ubicar el origen o destino</span></div>
    <ion-segment [value]="pointType" (ionChange)="onModeChange($event)">
      <ion-segment-button value="origin"><ion-label>● Origen</ion-label></ion-segment-button>
      <ion-segment-button value="destination"><ion-label>◆ Destino</ion-label></ion-segment-button>
    </ion-segment>
    <div #mapContainer class="route-map" role="application" aria-label="Mapa interactivo de origen y destino"></div>
    <div class="map-hint">Mapa base: © OpenStreetMap. La línea punteada no representa un recorrido por calles.</div>
  `,
  styles: [`
    :host {display:block;}
    .map-head {display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;margin-bottom:13px;}
    .map-head strong {font-size:15px;color:#14293a;}
    .map-head span {font-size:12px;color:#798ba0;}
    ion-segment {margin-bottom:12px;--background:#eef5f5;}
    ion-segment-button {--indicator-color:#0e6958;--color-checked:#fff;}
    .route-map {height:320px;border-radius:14px;overflow:hidden;z-index:0;border:1px solid #dce7e9;}
    .map-hint {font-size:11px;color:#8c99a8;margin-top:11px;}
    @media(max-width:600px) {.route-map{height:250px;}}
  `]
})
export class MapPickerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;
  @Input() origin: Coordinates = { latitude: 2.9386, longitude: -75.2819 };
  @Input() destination: Coordinates = { latitude: 2.944, longitude: -75.29 };
  @Output() pointPicked = new EventEmitter<{ point: 'origin' | 'destination'; coords: Coordinates }>();
  pointType: 'origin' | 'destination' = 'origin';
  private map?: L.Map;
  private originMarker?: L.CircleMarker;
  private destMarker?: L.CircleMarker;
  private path?: L.Polyline;

  ngAfterViewInit(): void {
    this.map = L.map(this.mapContainer.nativeElement).setView([this.origin.latitude, this.origin.longitude], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors', maxZoom: 19
    }).addTo(this.map);
    this.map.on('click', event => {
      this.pointPicked.emit({ point: this.pointType, coords: { latitude: event.latlng.lat, longitude: event.latlng.lng } });
    });
    this.draw();
    setTimeout(() => this.map?.invalidateSize(), 100);
  }
  ngOnChanges(_changes: SimpleChanges): void { this.draw(); }
  ngOnDestroy(): void { this.map?.remove(); }
  onModeChange(event: CustomEvent): void {
    if (event.detail.value === 'origin' || event.detail.value === 'destination') this.pointType = event.detail.value;
  }
  private draw(): void {
    if (!this.map) return;
    const a: L.LatLngExpression = [this.origin.latitude, this.origin.longitude];
    const b: L.LatLngExpression = [this.destination.latitude, this.destination.longitude];
    this.originMarker?.remove(); this.destMarker?.remove(); this.path?.remove();
    this.originMarker = L.circleMarker(a, { radius: 9, color: '#fff', fillColor: '#0eaa83', fillOpacity: 1, weight: 3 }).addTo(this.map).bindPopup('Origen');
    this.destMarker = L.circleMarker(b, { radius: 9, color: '#fff', fillColor: '#122c49', fillOpacity: 1, weight: 3 }).addTo(this.map).bindPopup('Destino');
    this.path = L.polyline([a, b], { color: '#1e9c84', dashArray: '7, 7', weight: 4 }).addTo(this.map);
  }
}
