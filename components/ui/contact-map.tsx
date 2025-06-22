'use client';

import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Connection } from '@/lib/types';
import { LatLngExpression } from 'leaflet';
import { Linkedin } from 'lucide-react';

interface ContactMapProps {
  contacts: (Connection & { lat?: number; lng?: number })[];
}

const ContactMap: React.FC<ContactMapProps> = ({ contacts }) => {
  const contactsWithCoords = contacts.filter(
    (c) => c.lat !== undefined && c.lng !== undefined
  );

  if (contactsWithCoords.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No contacts with location data to display on the map.
      </div>
    );
  }

  // Calculate the center of the map
  const avgLat =
    contactsWithCoords.reduce((acc, c) => acc + c.lat!, 0) /
    contactsWithCoords.length;
  const avgLng =
    contactsWithCoords.reduce((acc, c) => acc + c.lng!, 0) /
    contactsWithCoords.length;

  const center: LatLngExpression =
    !isNaN(avgLat) && !isNaN(avgLng) ? [avgLat, avgLng] : [0, 0];
  const zoom = !isNaN(avgLat) && !isNaN(avgLng) ? 4 : 1;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      style={{ height: '600px', width: '100%', borderRadius: '1rem' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {contactsWithCoords.map((contact) => (
        <Marker
          key={contact.URL}
          position={[contact.lat!, contact.lng!]}
        >
          <Popup>
            <div className="flex flex-col space-y-1">
              <h3 className="font-bold text-md">
                {contact['First Name']} {contact['Last Name']}
              </h3>
              <p className="text-sm">{contact.Position}</p>
              <p className="text-xs text-gray-500">{contact.Company}</p>
              <a
                href={contact.URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 inline-flex items-center"
              >
                <Linkedin size={16} className="mr-1" />
                View Profile
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default ContactMap; 