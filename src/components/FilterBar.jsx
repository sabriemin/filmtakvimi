
import React, { useState } from 'react'
import { Listbox } from '@headlessui/react'

const universes = ['Marvel', 'DC', 'Star Wars', 'Harry Potter', 'Matrix']

export default function FilterBar({ selected, setSelected }) {
  return (
    <div className="p-4 flex flex-wrap gap-4 items-center bg-white/5 backdrop-blur border-b border-white/10">
      <input
        type="text"
        placeholder="Ara..."
        className="px-4 py-2 rounded-lg bg-white/10 text-white placeholder-gray-300 border border-white/20"
      />

      <Listbox value={selected} onChange={setSelected}>
        <div className="relative">
          <Listbox.Button className="bg-white text-gray-800 rounded-lg px-4 py-2">
            {selected}
          </Listbox.Button>
          <Listbox.Options className="absolute mt-1 bg-white text-gray-800 rounded-md shadow-lg">
            {universes.map((universe) => (
              <Listbox.Option
                key={universe}
                value={universe}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              >
                {universe}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </div>
      </Listbox>
    </div>
  )
}
