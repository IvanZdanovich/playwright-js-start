import { api } from '../../support/urls';
import { readResponse } from '../../support/api-response';

/**
 * Restful Booker API commands. Each takes the Playwright `APIRequestContext` first and one pre-composed
 * example request object second (`{ token, bookingId, body, qs, restOptions }`), and resolves to
 * `{ status, headers, body }`. Playwright never throws on a 4xx or 5xx, so every caller asserts `status` first.
 * `restOptions` is spread last into the fetch options for per-call overrides such as `timeout` or `headers`.
 */

// Maps camelCase example fields to the API's lowercase wire format.
const mapBookingFields = (body) => {
  const mapped = {};

  if (body.firstname !== undefined) mapped.firstname = body.firstname;
  if (body.lastname !== undefined) mapped.lastname = body.lastname;
  if (body.totalPrice !== undefined) mapped.totalprice = body.totalPrice;
  if (body.depositPaid !== undefined) mapped.depositpaid = body.depositPaid;
  if (body.additionalNeeds !== undefined) mapped.additionalneeds = body.additionalNeeds;

  if (body.bookingDates !== undefined) {
    mapped.bookingdates = {
      checkin: body.bookingDates.checkin,
      checkout: body.bookingDates.checkout,
    };
  }

  return mapped;
};

const send = async (request, { method, url, headers = {}, data, params, restOptions = {} }) =>
  readResponse(
    await request.fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      data,
      params,
      ...restOptions,
    }),
  );

/** Get an authentication token. `body`: `{ username, password }`. */
export async function restfulBooker__getAuthToken__POST(request, { body, restOptions = {} }) {
  const { username, password } = body;
  return send(request, { method: 'POST', url: api.auth, data: { username, password }, restOptions });
}

/** Create a booking. */
export async function restfulBooker__createBooking__POST(request, { body, restOptions = {} }) {
  return send(request, { method: 'POST', url: api.booking, data: mapBookingFields(body), restOptions });
}

/** Get booking IDs, optionally filtered by `qs`: `{ firstname, lastname, checkin, checkout }`. */
export async function restfulBooker__getBookingIds__GET(request, { qs = {}, restOptions = {} } = {}) {
  const params = Object.fromEntries(Object.entries(qs).filter(([key, value]) => ['firstname', 'lastname', 'checkin', 'checkout'].includes(key) && value !== undefined));
  return send(request, { method: 'GET', url: api.booking, params, restOptions });
}

/** Get one booking by ID. */
export async function restfulBooker__getBookingById__GET(request, { bookingId, restOptions = {} }) {
  return send(request, { method: 'GET', url: `${api.booking}/${bookingId}`, headers: { Accept: 'application/json' }, restOptions });
}

/** Fully update a booking (PUT). */
export async function restfulBooker__updateBooking__PUT(request, { token, bookingId, body, restOptions = {} }) {
  return send(request, {
    method: 'PUT',
    url: `${api.booking}/${bookingId}`,
    headers: { Accept: 'application/json', Cookie: `token=${token}` },
    data: mapBookingFields(body),
    restOptions,
  });
}

/** Partially update a booking (PATCH). */
export async function restfulBooker__partialUpdateBooking__PATCH(request, { token, bookingId, body, restOptions = {} }) {
  return send(request, {
    method: 'PATCH',
    url: `${api.booking}/${bookingId}`,
    headers: { Accept: 'application/json', Cookie: `token=${token}` },
    data: mapBookingFields(body),
    restOptions,
  });
}

/** Delete a booking. */
export async function restfulBooker__deleteBooking__DELETE(request, { token, bookingId, restOptions = {} }) {
  return send(request, { method: 'DELETE', url: `${api.booking}/${bookingId}`, headers: { Cookie: `token=${token}` }, restOptions });
}

/**
 * Delete every booking whose firstname/lastname pair appears anywhere in the examples object.
 * Used before and after a spec so each file starts and ends without leftovers. Returns the deleted IDs.
 */
export async function restfulBooker__bulkDelete__DELETE(request, { token, examples }) {
  const identifiers = [];
  const collect = (value) => {
    if (!value || typeof value !== 'object') return;
    if (value.firstname && value.lastname) {
      if (!identifiers.some((known) => known.firstname === value.firstname && known.lastname === value.lastname)) {
        identifiers.push({ firstname: value.firstname, lastname: value.lastname });
      }
      return;
    }
    Object.values(value).forEach(collect);
  };
  collect(examples);

  const deleted = [];
  for (const qs of identifiers) {
    const list = await restfulBooker__getBookingIds__GET(request, { qs });
    if (list.status !== 200 || !Array.isArray(list.body)) continue;
    for (const { bookingid } of list.body) {
      const response = await restfulBooker__deleteBooking__DELETE(request, { token, bookingId: bookingid });
      if (response.status === 201) deleted.push(bookingid);
    }
  }
  return deleted;
}
