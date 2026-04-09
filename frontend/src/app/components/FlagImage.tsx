"use client";

interface FlagImageProps {
  isoCode: string;
}

export default function FlagImage({ isoCode }: FlagImageProps) {
  // Mapping for 3-letter to 2-letter codes
  const mapping: Record<string, string> = {
    NOR: "no",
    ESP: "es",
    ENG: "gb",
    FRA: "fr",
    GER: "de",
    ITA: "it",
    ARG: "ar",
    BRA: "br",
    POR: "pt",
    NED: "nl",
    IRN: "ir",
    USA: "us",
  };

  const code = mapping[isoCode] || isoCode.substring(0, 2).toLowerCase();
  const src = `https://flagcdn.com/w40/${code}.png`;

  return (
    <img
      src={src}
      alt={isoCode}
      className="rounded-sm object-cover border border-gray-700 w-full h-full"
      onError={(e) => {
        // This function now runs safely on the client
        e.currentTarget.src = "https://flagcdn.com/w40/un.png";
      }}
    />
  );
}
