export default function FlightSearchLayout({
  children,
  flightFilter,
  flightResult,
}: {
  children: React.ReactNode;
  flightFilter: React.ReactNode;
  flightResult: React.ReactNode;
}) {
  return (
    <main className="mx-auto my-10 w-[90%]">
      {children}
      <section className="mx-auto flex w-full flex-col justify-center gap-[24px] lg:flex-row">
        {flightFilter}
        {flightResult}
      </section>
    </main>
  );
}