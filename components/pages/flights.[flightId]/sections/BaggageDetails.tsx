import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Weight {
  value: number;
  measurementUnit: string;
}

interface Dimensions {
  length: number;
  width: number;
  height: number;
  measurementUnit: string;
}

interface BaggageAllowance {
  maxPieces?: number;
  maxWeight?: Weight;
  maxDimensions?: Dimensions;
}

interface Fee {
  feeAmount: number;
  currency: string;
  feeType: string;
}

interface BaggageDetailsProps {
  baggage: {
    currency?: string;
    carryOn?: BaggageAllowance;
    checked?: BaggageAllowance;
    excessWeightFee?: Fee;
    excessPieceFee?: Fee;
    specialBaggage?: {
      description?: string;
      maxWeight?: Weight;
      maxDimensions?: Dimensions;
    };
  };
}

function formatWeight(weight?: Weight) {
  if (!weight) return "N/A";
  return `${weight.value} ${weight.measurementUnit}`;
}

function formatDimensions(dim?: Dimensions) {
  if (!dim) return "N/A";
  return `${dim.length} x ${dim.width} x ${dim.height} ${dim.measurementUnit}`;
}

function BaggageSection({ title, data }: { title: string; data?: BaggageAllowance }) {
  if (!data) return null;
  return (
    <section>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <strong className="dark:text-white">Max Pieces:</strong> <span className="dark:text-gray-300">{data.maxPieces ?? "N/A"}</span>
        </div>
        <div>
          <strong className="dark:text-white">Max Weight:</strong> <span className="dark:text-gray-300">{formatWeight(data.maxWeight)}</span>
        </div>
        <div>
          <strong className="dark:text-white">Max Dimensions:</strong> <span className="dark:text-gray-300">{formatDimensions(data.maxDimensions)}</span>
        </div>
      </div>
    </section>
  );
}

function FeeDetail({ label, fee }: { label: string; fee?: Fee }) {
  if (!fee) return null;
  return (
    <div>
      <Badge className="mr-2">{label}</Badge>
      {fee.feeAmount} {fee.currency} ({fee.feeType})
    </div>
  );
}

export default function BaggageDetails({ baggage }: BaggageDetailsProps) {
  return (
    <Card className="mx-auto w-full max-w-3xl dark:bg-gray-800 dark:border-gray-700">
      <CardContent className="space-y-3 p-3">
        <BaggageSection title="Carry-on Baggage" data={baggage.carryOn} />
        <Separator className="dark:bg-gray-700" />
        <BaggageSection title="Checked Baggage" data={baggage.checked} />
        {(baggage.excessWeightFee || baggage.excessPieceFee) && (
          <>
            <Separator className="dark:bg-gray-700" />
            <section>
              <h3 className="mb-2 text-lg font-semibold dark:text-white">Excess Baggage Fees</h3>
              <div className="space-y-2 text-sm">
                <FeeDetail label="Weight Fee" fee={baggage.excessWeightFee} />
                <FeeDetail label="Piece Fee" fee={baggage.excessPieceFee} />
              </div>
            </section>
          </>
        )}
        {baggage.specialBaggage && (
          <>
            <Separator className="dark:bg-gray-700" />
            <section>
              <h3 className="mb-2 text-lg font-semibold dark:text-white">Special Baggage</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <strong className="dark:text-white">Description:</strong> {baggage.specialBaggage.description || "N/A"}
                </p>
                <p>
                  <strong className="dark:text-white">Max Weight:</strong> {formatWeight(baggage.specialBaggage.maxWeight)}
                </p>
                <p>
                  <strong className="dark:text-white">Max Dimensions:</strong> {formatDimensions(baggage.specialBaggage.maxDimensions)}
                </p>
              </div>
            </section>
          </>
        )}
        <Separator className="dark:bg-gray-700" />
        <div className="text-right text-xs text-muted-foreground dark:text-gray-400">
          All weights are shown in {baggage?.carryOn?.maxWeight?.measurementUnit || "kg"}. Currency:{" "}
          {baggage.currency || "N/A"}
        </div>
      </CardContent>
    </Card>
  );
}