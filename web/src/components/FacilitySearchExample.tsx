/**
 * Example Facility Search Component
 * Demonstrates how to use the useFacilities hook
 */

"use client";

import { useState } from "react";
import { useFacilities } from "@/lib/hooks/useFacilities";

export default function FacilitySearchExample() {
  const [zipCode, setZipCode] = useState("");
  const [radius, setRadius] = useState(25);
  const [autismOnly, setAutismOnly] = useState(true);

  const { facilities, loading, error, total, searchFacilities, reset } =
    useFacilities();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (zipCode.length !== 5) {
      alert("Please enter a valid 5-digit zip code");
      return;
    }

    await searchFacilities({
      zip_code: zipCode,
      radius,
      autism_only: autismOnly,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Find Autism Service Facilities</h1>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8 space-y-4">
        <div>
          <label
            htmlFor="zipCode"
            className="block text-sm font-medium mb-2"
          >
            Zip Code
          </label>
          <input
            id="zipCode"
            type="text"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="Enter 5-digit zip code"
            maxLength={5}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label
            htmlFor="radius"
            className="block text-sm font-medium mb-2"
          >
            Search Radius: {radius} miles
          </label>
          <input
            id="radius"
            type="range"
            min="1"
            max="100"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex items-center">
          <input
            id="autismOnly"
            type="checkbox"
            checked={autismOnly}
            onChange={(e) => setAutismOnly(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="autismOnly" className="text-sm font-medium">
            Show autism-related providers only
          </label>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Searching..." : "Search"}
          </button>

          <button
            type="button"
            onClick={reset}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="p-4 mb-6 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Results Summary */}
      {total > 0 && (
        <div className="mb-6">
          <p className="text-lg font-semibold">
            Found {total} {total === 1 ? "facility" : "facilities"} near {zipCode}
          </p>
        </div>
      )}

      {/* Facilities List */}
      {facilities.length > 0 && (
        <div className="space-y-4">
          {facilities.map((facility) => (
            <div
              key={facility.id}
              className="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold">{facility.name}</h3>
                {facility.rating && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    ⭐ {facility.rating.toFixed(1)}
                  </span>
                )}
              </div>

              <p className="text-gray-600 mb-2">
                {facility.address}
                {facility.city && `, ${facility.city}`}
                {facility.state && `, ${facility.state}`}
                {facility.zip_code && ` ${facility.zip_code}`}
              </p>

              {facility.phone && (
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Phone:</span>{" "}
                  <a
                    href={`tel:${facility.phone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {facility.phone}
                  </a>
                </p>
              )}

              {facility.distance && (
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Distance:</span>{" "}
                  {facility.distance.toFixed(1)} miles
                </p>
              )}

              {facility.services.length > 0 && (
                <div className="mb-2">
                  <span className="font-medium">Services:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {facility.services.map((service) => (
                      <span
                        key={service}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {facility.website && (
                <a
                  href={facility.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Visit Website →
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && facilities.length === 0 && total === 0 && zipCode && !error && (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">
            No facilities found. Try adjusting your search criteria.
          </p>
        </div>
      )}
    </div>
  );
}
