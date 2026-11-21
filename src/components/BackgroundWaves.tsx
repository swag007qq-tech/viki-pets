export function BackgroundWaves() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden select-none" aria-hidden="true">
      {/* Desktop 16:9 exact wave framing */}
      <svg
        className="hidden h-full w-full lg:block"
        viewBox="0 0 1670 941"
        preserveAspectRatio="none"
      >
        <rect width="1670" height="941" fill="#FDF5EE" />

        {/* Top-left waves */}
        <path
          d="M0,0 L410,0 C370,65 340,120 275,180 C185,260 120,275 110,335 C100,395 140,440 85,515 C45,565 15,590 0,610 Z"
          fill="#F6E3D6"
        />
        <path
          d="M0,0 L190,0 C175,48 140,95 92,132 C50,164 20,180 0,190 Z"
          fill="#EED9CB"
        />

        {/* Bottom-left waves */}
        <path
          d="M0,480 C65,495 165,535 215,610 C255,670 218,745 235,815 C250,875 335,915 415,941 L0,941 Z"
          fill="#F4E0D3"
        />
        <path
          d="M0,555 C60,575 135,620 162,678 C184,725 148,770 162,812 C180,865 315,905 435,941 L0,941 Z"
          fill="#BC9D87"
        />

        {/* Top-right waves */}
        <path
          d="M950,0 L1670,0 L1670,565 C1630,520 1595,465 1600,395 C1605,310 1560,255 1435,235 C1310,215 1235,175 1185,115 C1135,55 1035,18 950,0 Z"
          fill="#EAD5C6"
        />
        <path
          d="M960,0 L1670,0 L1670,560 C1640,545 1615,515 1608,470 C1598,405 1622,340 1615,280 C1605,195 1545,130 1440,85 C1325,38 1110,18 960,0 Z"
          fill="#BA967E"
        />
        <path
          d="M1405,0 L1670,0 L1670,175 C1610,145 1545,95 1495,52 C1460,22 1432,8 1405,0 Z"
          fill="#A8836C"
        />

        {/* Bottom-right wave */}
        <path
          d="M1670,735 C1635,775 1615,820 1608,865 C1598,912 1535,932 1465,941 L1670,941 Z"
          fill="#F4E0D4"
        />
      </svg>

      {/* Mobile & Tablet proportional corner waves */}
      <div className="relative h-full w-full bg-[#FDF5EE] lg:hidden">
        <svg
          className="absolute top-0 left-0 h-56 w-64 sm:h-72 sm:w-80"
          viewBox="0 0 320 280"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0 L310,0 C275,65 240,120 175,165 C105,210 45,235 0,275 Z"
            fill="#F6E3D6"
          />
          <path
            d="M0,0 L160,0 C140,48 105,90 60,122 C30,145 12,155 0,165 Z"
            fill="#EED9CB"
          />
        </svg>

        <svg
          className="absolute top-0 right-0 h-56 w-64 sm:h-72 sm:w-96"
          viewBox="0 0 380 280"
          preserveAspectRatio="none"
        >
          <path
            d="M40,0 L380,0 L380,270 C340,245 315,200 285,155 C245,95 155,40 40,0 Z"
            fill="#EAD5C6"
          />
          <path
            d="M110,0 L380,0 L380,230 C350,205 335,160 305,115 C270,62 195,25 110,0 Z"
            fill="#BA967E"
          />
          <path
            d="M235,0 L380,0 L380,105 C330,85 280,45 235,0 Z"
            fill="#A8836C"
          />
        </svg>

        <svg
          className="absolute bottom-0 left-0 h-52 w-56 sm:h-64 sm:w-72"
          viewBox="0 0 280 260"
          preserveAspectRatio="none"
        >
          <path
            d="M0,25 C65,45 135,95 160,155 C180,205 215,240 270,260 L0,260 Z"
            fill="#F4E0D3"
          />
          <path
            d="M0,85 C55,105 105,145 125,190 C140,225 180,245 230,260 L0,260 Z"
            fill="#BC9D87"
          />
        </svg>

        <svg
          className="absolute right-0 bottom-0 h-40 w-44 sm:h-52 sm:w-56"
          viewBox="0 0 220 200"
          preserveAspectRatio="none"
        >
          <path
            d="M220,30 C180,65 155,105 140,145 C125,180 80,192 20,200 L220,200 Z"
            fill="#F4E0D4"
          />
        </svg>
      </div>
    </div>
  );
}
