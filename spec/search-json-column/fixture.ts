import type { Address, Person } from './interface';

export const fixtures = [
    {
        colors: ['Red', 'Violet', 'Black'],
        friends: [],
        address: { city: 'Stockholm', street: '0 Hoard Circle', zip: '111 95' } as Address,
    },
    {
        colors: ['Orange', 'Blue', 'Yellow'],
        friends: [
            { id: 7, firstName: 'Katharyn', lastName: 'Davidovsky', email: 'kdavidovsky6@tmall.com', gender: 'Female' },
            { id: 6, firstName: 'Valeria', lastName: 'Loidl', email: 'vloidl5@nasa.gov', gender: 'Female' },
            { id: 9, firstName: 'Antone', lastName: 'Hartzogs', email: 'ahartzogs8@cdc.gov', gender: 'Male' },
        ] as Person[],
        address: { city: 'Bali', street: '27996 Declaration Lane', zip: '787-0150' } as Address,
    },
    {
        colors: ['Orange', 'Green', 'Black'],
        friends: [
            { id: 2, firstName: 'Taylor', lastName: 'Ruffles', email: 'truffles1@google.pl', gender: 'Male' },
            { id: 3, firstName: 'Maggi', lastName: 'Bon', email: 'mbon2@pagesperso-orange.fr', gender: 'Female' },
        ] as Person[],
        address: { city: 'Paris 19', street: '1250 Monica Parkway', zip: '75166 CEDEX 19' } as Address,
    },
];
