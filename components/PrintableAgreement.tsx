import React from 'react';
import { Client, Reservation, Trailer, RentalAgreement } from '@/lib/store';
import { format, parseISO } from 'date-fns';
import { translations } from '@/lib/translations';

interface PrintableAgreementProps {
  reservation: Reservation;
  client: Client;
  trailer: Trailer;
  agreement: RentalAgreement;
}

export const PrintableAgreement = React.forwardRef<HTMLDivElement, PrintableAgreementProps>(
  ({ reservation, client, trailer, agreement }, ref) => {
    
    const calculateTotalDeposit = () => {
      let total = Number(agreement.deposits?.general || 0);
      if (agreement.deposits?.lock) total += 35;
      if (agreement.deposits?.straps) total += 60;
      if (agreement.deposits?.adapter) total += 17;
      if (agreement.deposits?.registration) total += 200;
      return total;
    };

    const startDate = parseISO(reservation.startDate);
    const endDate = parseISO(reservation.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const content = (
      <div ref={ref} className="p-4 sm:p-6 print:p-0 bg-white text-black w-full max-w-[800px] mx-auto font-sans text-xs print:text-[10.5px] leading-snug" id="print-area">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-black pb-2 print:pb-1 mb-2 print:mb-1.5">
          <div className="text-xs print:text-[10px]">
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Doll Fahrzeugbau oHG / Raudtener Str. 8 / 90475 Nürnberg</li>
              <li>Ust.-Id.-Nr. DE 228 243 158 / Gerichtsstand Nürnberg HRA10504</li>
              <li>Sparkasse Nürnberg IBAN DE16 7605 0101 0380 1607 88</li>
            </ul>
            <h1 className="text-xl print:text-lg font-bold mt-2">ANHÄNGER-MIETVERTRAG</h1>
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

        <p className="text-xs print:text-[9.5px] mb-2 print:mb-1 text-justify">
          Die Firma Doll Fahrzeugbau oHG, 90475 Nürnberg -nachstehend Vermieter genannt- überlässt den unten aufgeführten Anhänger an den
          nachfolgend genannten Mieter zu den im Einzelnen aufgeführten Bedingungen.
        </p>

        {/* Client Info */}
        <table className="w-full border-collapse border border-black text-xs print:text-[10px] mb-2 print:mb-1">
          <tbody>
            <tr>
              <td className="border border-black py-0.5 px-1.5 w-2/3">Herr/Frau/Firma: {client.name}</td>
              <td className="border border-black py-0.5 px-1.5 w-1/3">Tel.: {client.phone || ''}</td>
            </tr>
            <tr>
              <td className="border border-black py-0.5 px-1.5">Straße: {client.address || ''}</td>
              <td className="border border-black py-0.5 px-1.5">Mobil: </td>
            </tr>
            <tr>
              <td className="border border-black py-0.5 px-1.5" colSpan={2}>PLZ, Wohnort: </td>
            </tr>
          </tbody>
        </table>

        {/* License Info */}
        <table className="w-full border-collapse border border-black text-xs print:text-[10px] mb-1.5 print:mb-1">
          <tbody>
            <tr>
              <td className="border border-black py-0.5 px-1.5 w-1/3">Führerschein-Klasse: {client.driverLicenseClass || ''}</td>
              <td className="border border-black py-0.5 px-1.5 w-1/3">Ausgestellt am: {client.driverLicenseIssueDate ? format(parseISO(client.driverLicenseIssueDate), 'dd.MM.yyyy') : ''}</td>
              <td className="border border-black py-0.5 px-1.5 w-1/3">Ausstellungsort: {client.driverLicenseIssuePlace || ''}</td>
            </tr>
            <tr>
              <td className="border border-black py-0.5 px-1.5">Ausweis/Reisepass-Nr.: {client.idCardNumber || ''}</td>
              <td className="border border-black py-0.5 px-1.5">Gültig bis: {client.idCardExpiry ? format(parseISO(client.idCardExpiry), 'dd.MM.yyyy') : ''}</td>
              <td className="border border-black py-0.5 px-1.5">Ausstellungsort: {client.idCardIssuePlace || ''}</td>
            </tr>
          </tbody>
        </table>

        <p className="text-[9.5px] print:text-[8.5px] mb-2 print:mb-1 text-justify leading-tight">
          <strong>Führerschein:</strong> Der Fahrer des Zugfahrzeugs muss im Besitz einer Fahrerlaubnis der Klasse BE oder, wenn der Führerschein vor 1999 erteilt wurde, Klasse III
          sein. Nur der vorstehend genannte Mieter, dessen Arbeitnehmer oder Familienangehörige sind, sofern sie im Besitz der erforderlichen
          Fahrerlaubnis sind, zur Benutzung des Anhängers hinter einem Zugfahrzeug berechtigt. Bei Anhängern mit einem Gesamtgewicht von nicht
          mehr als 750 kg ist Führerschein Klasse B ausreichend.
        </p>

        {/* Trailer Info */}
        <h3 className="font-bold text-xs print:text-[10.5px] mb-0.5">Mietanhänger:</h3>
        <table className="w-full border-collapse text-xs print:text-[10px] mb-2 print:mb-1">
          <tbody>
            <tr>
              <td className="border border-black py-0.5 px-1.5 w-1/3">Amtl. Kennzeichen: <span className="font-bold">{trailer.plate}</span></td>
              <td className="w-2"></td>
              <td className="border border-black py-0.5 px-1.5 w-1/3">Gesamtgewicht: {trailer.capacity}</td>
            </tr>
            <tr>
              <td className="border border-black py-0.5 px-1.5">Typ: {(translations.de.trailerTypes as any)[trailer.type] || trailer.type}</td>
              <td className="w-2"></td>
              <td className="border border-black py-0.5 px-1.5">Nutzlast: </td>
            </tr>
          </tbody>
        </table>

        {/* Rental Period */}
        <h3 className="font-bold text-xs print:text-[10.5px] mb-0.5">Mietdauer:</h3>
        <p className="text-xs print:text-[9.5px] border border-black border-b-0 py-0.5 px-1.5">
          Das Mietverhältnis beginnt with der Abholung des Anhängers beim Vermieter und endet with der vereinbarten Rückgabe
        </p>
        <table className="w-full border-collapse border border-black text-xs print:text-[10px] mb-2 print:mb-1">
          <tbody>
            <tr>
              <td className="border border-black py-0.5 px-1.5 w-1/4">Abholung</td>
              <td className="border border-black py-0.5 px-1.5 w-1/2">Tag: {format(startDate, 'dd.MM.yyyy')}</td>
              <td className="border border-black py-0.5 px-1.5 w-1/4">Uhrzeit: {agreement.pickupTime || ''}</td>
            </tr>
            <tr>
              <td className="border border-black py-0.5 px-1.5">Rückgabe</td>
              <td className="border border-black py-0.5 px-1.5">Tag: {format(endDate, 'dd.MM.yyyy')}</td>
              <td className="border border-black py-0.5 px-1.5">Uhrzeit: {agreement.returnTime || ''}</td>
            </tr>
          </tbody>
        </table>

        {/* Pricing Table */}
        <table className="w-full border-collapse border border-black text-xs print:text-[9.5px] mb-2 print:mb-1">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black py-0.5 px-1 text-left">Leistung</th>
              <th className="border border-black py-0.5 px-1 text-left">Kalendertage</th>
              <th className="border border-black py-0.5 px-1 text-left">Einzelpreis</th>
              <th className="border border-black py-0.5 px-1 text-left">Summe</th>
              <th className="border border-black py-0.5 px-1 text-left">MwSt. 19%</th>
              <th className="border border-black py-0.5 px-1 text-left">Brutto</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black py-0.5 px-1">Tagespreis</td>
              <td className="border border-black py-0.5 px-1">{days}</td>
              <td className="border border-black py-0.5 px-1">{agreement.prices?.daily ? `${agreement.prices.daily} €` : ''}</td>
              <td className="border border-black py-0.5 px-1">{agreement.prices?.daily && days ? `${(agreement.prices.daily * days).toFixed(2)} €` : ''}</td>
              <td className="border border-black py-0.5 px-1">{agreement.prices?.daily && days ? `${((agreement.prices.daily * days) * 0.19 / 1.19).toFixed(2)} €` : ''}</td>
              <td className="border border-black py-0.5 px-1">{agreement.prices?.daily && days ? `${(agreement.prices.daily * days).toFixed(2)} €` : ''}</td>
            </tr>
            <tr>
              <td className="border border-black py-0.5 px-1">Wochenendpreis</td>
              <td className="border border-black py-0.5 px-1"></td>
              <td className="border border-black py-0.5 px-1">{agreement.prices?.weekend ? `${agreement.prices.weekend} €` : ''}</td>
              <td className="border border-black py-0.5 px-1">{agreement.prices?.weekend ? `${agreement.prices.weekend} €` : ''}</td>
              <td className="border border-black py-0.5 px-1"></td>
              <td className="border border-black py-0.5 px-1">{agreement.prices?.weekend ? `${agreement.prices.weekend} €` : ''}</td>
            </tr>
            <tr>
              <td className="border border-black py-0.5 px-1">Wochenpreis</td>
              <td className="border border-black py-0.5 px-1"></td>
              <td className="border border-black py-0.5 px-1">{agreement.prices?.weekly ? `${agreement.prices.weekly} €` : ''}</td>
              <td className="border border-black py-0.5 px-1">{agreement.prices?.weekly ? `${agreement.prices.weekly} €` : ''}</td>
              <td className="border border-black py-0.5 px-1"></td>
              <td className="border border-black py-0.5 px-1">{agreement.prices?.weekly ? `${agreement.prices.weekly} €` : ''}</td>
            </tr>
            <tr>
              <td className="border border-black py-0.5 px-1 font-bold">Mietpreis Gesamt (Brutto)</td>
              <td className="border border-black py-0.5 px-1"></td>
              <td className="border border-black py-0.5 px-1"></td>
              <td className="border border-black py-0.5 px-1"></td>
              <td className="border border-black py-0.5 px-1"></td>
              <td className="border border-black py-0.5 px-1 font-bold">{agreement.prices?.total ? `${Number(agreement.prices.total).toFixed(2)} €` : ''}</td>
            </tr>
            <tr>
              <td className="border border-black py-0.5 px-1">Diebstahlschloss</td>
              <td className="border border-black py-0.5 px-1">Pfand 35 €</td>
              <td className="border border-black py-0.5 px-1 text-center">{agreement.deposits?.lock ? 'X' : ''}</td>
              <td className="border border-black py-0.5 px-1"></td>
              <td className="border border-black py-0.5 px-1"></td>
              <td className="border border-black py-0.5 px-1">{agreement.deposits?.lock ? '35.00 €' : ''}</td>
            </tr>
            <tr>
              <td className="border border-black py-0.5 px-1">Gurte</td>
              <td className="border border-black py-0.5 px-1">Pfand 60 €</td>
              <td className="border border-black py-0.5 px-1 text-center">{agreement.deposits?.straps ? 'X' : ''}</td>
              <td className="border border-black py-0.5 px-1"></td>
              <td className="border border-black py-0.5 px-1"></td>
              <td className="border border-black py-0.5 px-1">{agreement.deposits?.straps ? '60.00 €' : ''}</td>
            </tr>
            <tr>
              <td className="border border-black py-0.5 px-1">Adapter</td>
              <td className="border border-black py-0.5 px-1">Pfand 17 €</td>
              <td className="border border-black py-0.5 px-1 text-center">{agreement.deposits?.adapter ? 'X' : ''}</td>
              <td className="border border-black py-0.5 px-1"></td>
              <td className="border border-black py-0.5 px-1"></td>
              <td className="border border-black py-0.5 px-1">{agreement.deposits?.adapter ? '17.00 €' : ''}</td>
            </tr>
            <tr>
              <td className="border border-black py-0.5 px-1">Fahrzeugschein / grüne Karte</td>
              <td className="border border-black py-0.5 px-1">Pfand 200€</td>
              <td className="border border-black py-0.5 px-1 text-center">{agreement.deposits?.registration ? 'X' : ''}</td>
              <td className="border border-black py-0.5 px-1"></td>
              <td className="border border-black py-0.5 px-1"></td>
              <td className="border border-black py-0.5 px-1">{agreement.deposits?.registration ? '200.00 €' : ''}</td>
            </tr>
            <tr>
              <td className="border border-black py-0.5 px-1 font-semibold">Kaution</td>
              <td className="border border-black py-0.5 px-1">{agreement.deposits?.general ? `${agreement.deposits.general} €` : ''}</td>
              <td className="border border-black py-0.5 px-1"></td>
              <td className="border border-black py-0.5 px-1"></td>
              <td className="border border-black py-0.5 px-1"></td>
              <td className="border border-black py-0.5 px-1 font-semibold">{agreement.deposits?.general ? `${Number(agreement.deposits.general).toFixed(2)} €` : ''}</td>
            </tr>
            <tr>
              <td className="border border-black py-0.5 px-1 font-bold">Gesamtbetrag inkl. Kaution</td>
              <td className="border border-black py-0.5 px-1"></td>
              <td className="border border-black py-0.5 px-1"></td>
              <td className="border border-black py-0.5 px-1"></td>
              <td className="border border-black py-0.5 px-1"></td>
              <td className="border border-black py-0.5 px-1 font-bold">
                {agreement.prices?.total || calculateTotalDeposit() ? `${(Number(agreement.prices?.total || 0) + calculateTotalDeposit()).toFixed(2)} €` : ''}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Payment Method */}
        <div className="flex items-center gap-4 text-xs print:text-[10px] mb-2 print:mb-1.5">
          <span>Der Mietpreis wurde wie folgt gezahlt:</span>
          <div className={`border border-black px-2.5 py-0.5 ${agreement.paymentMethod === 'BAR' ? 'bg-gray-200 font-bold' : ''}`}>BAR</div>
          <div className={`border border-black px-2.5 py-0.5 ${agreement.paymentMethod === 'EC-Karte' ? 'bg-gray-200 font-bold' : ''}`}>EC-Karte</div>
          <div className={`border border-black px-2.5 py-0.5 ${agreement.paymentMethod === 'Kreditkarte' ? 'bg-gray-200 font-bold' : ''}`}>Kreditkarte</div>
        </div>

        {/* Terms */}
        <p className="text-[9px] print:text-[8px] text-justify font-medium mb-3 print:mb-2 leading-tight">
          Der Anhänger wird dem Mieter in technisch einwandfreiem Zustand übergeben. Optische Beeinträchtigungen wie
          beispielsweise kleine Lackschäden, kleine Dellen, Kratzer oder Parkrempler stellen keine Fahrzeugmängel dar und sind
          vom Mieter zu akzeptieren. Der Mieter kann die Aufnahme vorhandener Mängel in das Übergabeprotokoll verlangen. Die
          allgemeinen Mietbedingungen sind Bestandteil dieses Mietvertrages. Bei Ausfall in Folge technischer Schäden werden keine Kosten u. Folgekosten übernommen. Bei Reifenschäden haftet
          der Mieter und hat die Kosten zu tragen. Der Anhänger ist Haftpflichtversichert mit 1000.- Euro SB im Schadenfall,
          Teilkasko ebenfalls with 1000.- Euro SB.
        </p>

        {/* Signatures */}
        <div className="flex justify-between text-xs print:text-[10px] mt-3 print:mt-1.5">
          <div className="w-1/3">
            <div className="border-b border-black mb-0.5">Nürnberg, {format(new Date(), 'dd.MM.yyyy')}</div>
            <div className="text-[10px] print:text-[9px]">Nürnberg, Datum</div>
          </div>
          <div className="w-1/3">
            <div className="border-b border-black mb-0.5 h-4"></div>
            <div className="text-[10px] print:text-[9px] text-center">Stempel + Unterschrift des Vermieters</div>
          </div>
          <div className="w-1/3">
            <div className="border-b border-black mb-0.5 h-4"></div>
            <div className="text-[10px] print:text-[9px] text-center">Unterschrift des Mieters</div>
          </div>
        </div>

      </div>
    );

    return content;
  }
);

PrintableAgreement.displayName = 'PrintableAgreement';
