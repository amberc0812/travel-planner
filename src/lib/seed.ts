import type { Trip } from './types'

/**
 * Seed data. Top-level details are Destinations (parents); other detail types
 * nest as children under a destination. Dates are real so derived values
 * (Duration, "Day X of Y") stay truthful. Chicago is the active "in trip".
 */
export const SEED_TRIPS: Trip[] = [
  {
    id: 'paris',
    title: 'Paris',
    description: 'Spring in the 6th — coffee, bookshops, and long lunches.',
    startDate: '2026-04-20',
    budget: '$2,100',
    people: 'Liam, Sofia',
    status: 'planning',
    days: [
      {
        id: 'paris-d1',
        details: [
          {
            id: 'paris-1',
            type: 'destination',
            text: 'Jardin du Luxembourg',
            lat: 48.8462,
            lon: 2.3372,
            collapsed: false,
            children: [
              { id: 'paris-1a', type: 'time', text: '10:00 — a slow morning, no alarms' },
              { id: 'paris-1b', type: 'note', text: 'Pick up a **carnet** of metro tickets at the first station.' },
            ],
          },
        ],
      },
      {
        id: 'paris-d2',
        details: [
          {
            id: 'paris-2',
            type: 'destination',
            text: "Musée d'Orsay",
            lat: 48.86,
            lon: 2.3266,
            collapsed: false,
            children: [{ id: 'paris-2a', type: 'money', text: 'Museum pass — €70 for two' }],
          },
          { id: 'paris-3', type: 'destination', text: 'Montmartre at dusk', lat: 48.8867, lon: 2.3431, collapsed: false, children: [] },
        ],
      },
    ],
  },
  {
    id: 'new-york',
    title: 'New York',
    description: 'A long weekend of walking and galleries.',
    startDate: '2026-05-10',
    budget: '$2,800',
    people: 'Emma, Noah',
    status: 'planning',
    days: [
      {
        id: 'ny-d1',
        details: [
          {
            id: 'ny-1',
            type: 'destination',
            text: 'Central Park — the Ramble',
            lat: 40.7829,
            lon: -73.9654,
            collapsed: false,
            children: [{ id: 'ny-1a', type: 'transportation', text: 'Subway A/C downtown' }],
          },
        ],
      },
      {
        id: 'ny-d2',
        details: [
          {
            id: 'ny-2',
            type: 'destination',
            text: 'Brooklyn Bridge walk',
            lat: 40.7061,
            lon: -73.9969,
            collapsed: false,
            children: [{ id: 'ny-2a', type: 'note', text: 'Cross at sunset, coffee on the Brooklyn side.' }],
          },
        ],
      },
    ],
  },
  {
    id: 'berlin',
    title: 'Berlin',
    description: 'Quiet museums and a lot of cycling.',
    startDate: '2026-06-05',
    budget: '$1,900',
    people: 'Olivia, Lucas',
    status: 'planning',
    days: [
      {
        id: 'berlin-d1',
        details: [
          { id: 'berlin-1', type: 'destination', text: 'Brandenburg Gate', lat: 52.5163, lon: 13.3777, collapsed: false, children: [] },
          {
            id: 'berlin-2',
            type: 'destination',
            text: 'Museum Island',
            lat: 52.5169,
            lon: 13.4019,
            collapsed: false,
            children: [{ id: 'berlin-2a', type: 'doc', text: 'Pergamon timed-entry ticket.pdf' }],
          },
        ],
      },
    ],
  },
  {
    id: 'chicago',
    title: 'Chicago',
    description: 'Love trip in July — lake walks and deep-dish.',
    startDate: '2026-06-24',
    budget: '$2,400',
    people: 'Mia, Ethan',
    status: 'intrip',
    days: [
      {
        id: 'chi-d1',
        details: [
          {
            id: 'chi-1',
            type: 'destination',
            text: 'Millennium Park',
            lat: 41.8826,
            lon: -87.6226,
            collapsed: false,
            children: [
              { id: 'chi-1a', type: 'time', text: '9:00 — coffee at Sawada' },
              { id: 'chi-1b', type: 'note', text: 'Start slow. The bean can wait until the crowds thin.' },
            ],
          },
        ],
      },
      {
        id: 'chi-d2',
        details: [
          {
            id: 'chi-2',
            type: 'destination',
            text: 'Art Institute of Chicago',
            lat: 41.8796,
            lon: -87.6237,
            collapsed: false,
            children: [{ id: 'chi-2a', type: 'money', text: 'Two tickets — $58' }],
          },
        ],
      },
      {
        id: 'chi-d3',
        details: [
          {
            id: 'chi-3',
            type: 'destination',
            text: 'Navy Pier',
            lat: 41.8917,
            lon: -87.6086,
            collapsed: false,
            children: [{ id: 'chi-3a', type: 'transportation', text: 'Water taxi from the Riverwalk' }],
          },
        ],
      },
      { id: 'chi-d4', details: [] },
      { id: 'chi-d5', details: [] },
      { id: 'chi-d6', details: [] },
      { id: 'chi-d7', details: [] },
    ],
  },
  {
    id: 'rome',
    title: 'Rome',
    description: 'Ruins in the morning, gelato by noon.',
    startDate: '2026-08-14',
    budget: '$2,300',
    people: 'Ava, Mason',
    status: 'done',
    days: [
      {
        id: 'rome-d1',
        details: [
          { id: 'rome-1', type: 'destination', text: 'Colosseum', lat: 41.8902, lon: 12.4922, collapsed: false, children: [] },
          { id: 'rome-2', type: 'destination', text: 'Trevi Fountain', lat: 41.9009, lon: 12.4833, collapsed: false, children: [] },
        ],
      },
    ],
  },
  {
    id: 'cape-town',
    title: 'Cape Town',
    description: 'Mountain and ocean in the same afternoon.',
    startDate: '2026-09-30',
    budget: '$3,100',
    people: 'Isabella, Jacob',
    status: 'done',
    days: [
      {
        id: 'ct-d1',
        details: [
          { id: 'ct-1', type: 'destination', text: 'Table Mountain cableway', lat: -33.9628, lon: 18.4098, collapsed: false, children: [] },
          { id: 'ct-2', type: 'destination', text: 'V&A Waterfront', lat: -33.9036, lon: 18.4207, collapsed: false, children: [] },
        ],
      },
    ],
  },
  {
    id: 'rio',
    title: 'Rio de Janeiro',
    description: 'Beaches, viewpoints, and live samba.',
    startDate: '2026-10-19',
    budget: '$2,600',
    people: 'Charlotte, Benjamin',
    status: 'done',
    days: [
      {
        id: 'rio-d1',
        details: [
          { id: 'rio-1', type: 'destination', text: 'Christ the Redeemer', lat: -22.9519, lon: -43.2105, collapsed: false, children: [] },
          { id: 'rio-2', type: 'destination', text: 'Copacabana Beach', lat: -22.9711, lon: -43.1822, collapsed: false, children: [] },
        ],
      },
    ],
  },
]
