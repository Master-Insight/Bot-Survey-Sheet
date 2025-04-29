// Estructura general de contacto - se puede omitir lo que no se usa

export const contact = {
  addresses: [
    {
      street: "123 Calle de las Mascotas",
      city: "Ciudad",
      state: "Estado",
      zip: "12345",
      country: "País",
      country_code: "PA",
      type: "WORK"
    }
  ],
  emails: [
    {
      email: "contacto@medpet.com",
      type: "WORK"
    }
  ],
  name: {
    formatted_name: "MedPet Contacto",
    first_name: "MedPet",
    last_name: "Contacto",
    middle_name: "",
    suffix: "",
    prefix: ""
  },
  org: {
    company: "MedPet",
    department: "Atención al Cliente",
    title: "Representante"
  },
  phones: [
    {
      phone: "+1234567890",
      wa_id: "1234567890",
      type: "WORK"
    }
  ],
  urls: [
    {
      url: "https://www.medpet.com",
      type: "WORK"
    }
  ]
};

export const location = {
  latitude: 6.2071694,
  longitude: -75.574607,
  name: 'Platzi Medellín',
  address: 'Cra. 43A #5A - 113, El Poblado, Medellín, Antioquia.',
}