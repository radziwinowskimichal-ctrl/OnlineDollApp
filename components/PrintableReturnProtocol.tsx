import React from 'react';
import { Client, Reservation, Trailer } from '@/lib/store';

interface PrintableReturnProtocolProps {
  reservation: Reservation;
  client: Client;
  trailer: Trailer;
}

const CheckboxCell = ({ label, checked }: { label: string, checked?: boolean }) => (
  <div className="flex items-center gap-1 px-1 py-0.5 border-r border-black last:border-r-0">
    <div className={`w-3.5 h-3.5 border border-black flex items-center justify-center ${checked ? 'bg-black text-white' : ''}`}>
      {checked && <span className="text-[10px] leading-none font-bold">✕</span>}
    </div>
    <span className="text-[10px]">{label}</span>
  </div>
);

export const PrintableReturnProtocol = React.forwardRef<HTMLDivElement, PrintableReturnProtocolProps>(
  ({ reservation, client, trailer }, ref) => {
    const protocol = reservation.protocol;
    const protocolItems = [
      { label: 'Fahrzeugausstattung', key: 'fahrzeugausstattung' as const },
      { label: 'Plane und Spriegel', key: 'planeUndSpriegel' as const },
      { label: 'Kofferaufbau', key: 'kofferaufbau' as const },
      { label: 'Kupplung, Schlingerkupplung', key: 'kupplung' as const },
      { label: 'Auflaufbremse, ungebremst', key: 'auflaufbremse' as const },
      { label: 'Elektrik, Anschlusskabel, Adapter', key: 'elektrik' as const },
      { label: 'Reifen, Felge, Ersatzrad', key: 'reifen' as const },
      { label: 'Stützrad, Abstellstützen', key: 'stuetzrad' as const },
      { label: 'Bordwände', key: 'bordwaende' as const },
      { label: 'Leuchten', key: 'leuchten' as const },
    ];

    const content = (
      <div ref={ref} className="p-4 sm:p-6 print:p-0 bg-white text-black w-full max-w-[800px] mx-auto font-sans text-xs print:text-[10px] leading-snug" id="print-area-return">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-black pb-2 print:pb-1 mb-2 print:mb-1.5">
          <div className="text-xs print:text-[10px]">
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Doll Fahrzeugbau oHG / Raudtener Str. 8 / 90475 Nürnberg</li>
              <li>Ust.-Id.-Nr. DE 228 243 158</li>
            </ul>
            <h1 className="text-xl print:text-lg font-bold mt-1 uppercase">Anhänger-Mietvertrag</h1>
            <h2 className="text-base print:text-sm font-bold">und Rechnung</h2>
          </div>
          <div className="text-right text-xs print:text-[10px]">
            <div className="text-red-600 font-bold text-3xl print:text-2xl tracking-tighter mb-0.5">DOLLCO</div>
            <p>Tel.-Nr. 0911 /83 05 04</p>
            <p>Fax-Nr. 0911 / 83 23 64</p>
            <p>email: dollco@gmx.de</p>
            <p>web: www.dollco.de</p>
          </div>
        </div>

        <h3 className="text-base print:text-sm font-bold text-center mb-2 print:mb-1.5">Übergabe – und Rückgabeprotokoll<br/>PKW Anhänger</h3>

        <table className="w-full border-collapse border border-black text-xs print:text-[10px] mb-2 print:mb-1.5">
          <tbody>
            <tr>
              <td className="border border-black py-0.5 px-1.5 w-1/2">Mieter: {client.name}</td>
              <td className="border border-black py-0.5 px-1.5 w-1/2" colSpan={2}>Fahrzeug: {trailer.plate}</td>
            </tr>
            <tr className="bg-gray-100 font-bold">
              <td className="border border-black py-0.5 px-1.5">Übergabeprotokoll für Anhänger</td>
              <td className="border border-black py-0.5 px-1.5 w-1/4">Zustand bei Übergabe</td>
              <td className="border border-black py-0.5 px-1.5 w-1/4">Zustand bei Rückgabe</td>
            </tr>
            <tr>
              <td className="border border-black py-0.5 px-1.5 font-medium">Zutreffendes ankreuzen</td>
              <td className="border border-black p-0">
                <div className="flex w-full">
                  <div className="w-1/2"><CheckboxCell label="gut" /></div>
                  <div className="w-1/2"><CheckboxCell label="Mängel*" /></div>
                </div>
              </td>
              <td className="border border-black p-0">
                <div className="flex w-full">
                  <div className="w-1/2"><CheckboxCell label="gut" /></div>
                  <div className="w-1/2"><CheckboxCell label="Mängel*" /></div>
                </div>
              </td>
            </tr>
            {protocolItems.map((item) => (
              <tr key={item.key}>
                <td className="border border-black py-0.5 px-1.5">{item.label}</td>
                <td className="border border-black p-0">
                   <div className="flex w-full">
                    <div className="w-1/2"><CheckboxCell label="gut" checked={protocol?.[item.key]?.uebergabe === true} /></div>
                    <div className="w-1/2"><CheckboxCell label="Mängel*" checked={protocol?.[item.key]?.uebergabe === false} /></div>
                  </div>
                </td>
                <td className="border border-black p-0">
                   <div className="flex w-full">
                    <div className="w-1/2"><CheckboxCell label="gut" checked={protocol?.[item.key]?.rueckgabe === true} /></div>
                    <div className="w-1/2"><CheckboxCell label="Mängel*" checked={protocol?.[item.key]?.rueckgabe === false} /></div>
                  </div>
                </td>
              </tr>
            ))}
            <tr>
              <td className="border border-black py-0.5 px-1.5 font-medium bg-gray-50" colSpan={3}>Mängelbeschreibung *</td>
            </tr>
            <tr>
              <td className="border border-black py-1 px-1.5 h-12 print:h-10 align-top text-[10px]" colSpan={3}>
                {protocol?.damageDescription || ''}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Damage Graphic Sketch area */}
        <div className="border border-black p-2 mb-2 print:mb-1.5 relative w-full h-24 print:h-22 flex flex-col items-center justify-center">
            <span className="absolute top-1.5 left-2 text-[10px] font-medium">Karosserie: Festgestellte Schäden (Schaden in Skizze markieren)</span>
            <div className="w-2/3 h-12 print:h-10 border-2 border-black flex items-center justify-center bg-gray-100 rounded-sm">
                <span className="text-gray-400 text-[10px]">Anhänger Skizze</span>
            </div>
            <div className="w-6 h-6 border-2 border-black rounded-full absolute -ml-20 mt-8 bg-gray-800"></div>
            <div className="w-6 h-6 border-2 border-black rounded-full absolute ml-20 mt-8 bg-gray-800"></div>
            <div className="w-12 h-3 border-2 border-l-0 border-black absolute right-[12%] top-[45%]"></div>
        </div>

        <table className="w-full border-collapse border border-black text-xs print:text-[10px]">
          <tbody>
            <tr>
              <td className="border border-black py-0.5 px-1.5 w-1/4">Datum: {protocol?.returnDate || ''}</td>
              <td className="border border-black py-0.5 px-1.5 w-3/4 font-medium" colSpan={2}>Der Inhalt des vorstehenden Protokolls wird bestätigt:</td>
            </tr>
            <tr>
              <td className="border border-black py-0.5 px-1.5 h-12 print:h-10"></td>
              <td className="border border-black py-0.5 px-1.5 h-12 print:h-10 align-bottom w-3/8">Unterschrift Mieter:</td>
              <td className="border border-black py-0.5 px-1.5 h-12 print:h-10 align-bottom w-3/8">Unterschrift Vermieter:</td>
            </tr>
          </tbody>
        </table>

      </div>
    );

    return content;
  }
);

PrintableReturnProtocol.displayName = 'PrintableReturnProtocol';
