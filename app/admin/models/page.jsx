import { getData } from "@/lib/data";
import { sortDeviceModels } from "@/lib/deviceModels";
import DeviceModelManager from "../components/DeviceModelManager";

export const dynamic = "force-dynamic";

export default function AdminDeviceModelsPage() {
  const { deviceModels, deviceTypes } = getData();

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <p className="section-kicker">Catalog</p>
        <h1 className="admin-page-title">Device models</h1>
        <p className="admin-page-lead">
          Hardware catalog for any manufacturer — Shelly, AVM, WiZ, cameras, and more. Each model can link a manual,
          suggest a device category, and appear in the model picker when editing devices.
        </p>
      </header>

      <DeviceModelManager initialModels={sortDeviceModels(deviceModels)} deviceTypes={deviceTypes} />
    </div>
  );
}
