import React from "react";
import { FileText, Plus, Trash2, Upload, FileSpreadsheet } from "lucide-react";
import Card from "@/components/ui/Card";
import FormField from "@/components/ui/FormField";
import GradientButton from "@/components/ui/GradientButton";
import AlertMessage from "@/components/ui/AlertMessage";

interface DataField {
  id: string;
  name: string;
  description: string;
  example: string;
}

interface DataStructureStepProps {
  dataFields: DataField[];
  onAddField: () => void;
  onRemoveField: (id: string) => void;
  onUpdateField: (id: string, field: keyof DataField, value: string) => void;
  onLoadTestData: () => void;
  onCsvUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  csvUploadError: string;
  error?: string;
}

export default function DataStructureStep({
  dataFields,
  onAddField,
  onRemoveField,
  onUpdateField,
  onLoadTestData,
  onCsvUpload,
  csvUploadError,
  error,
}: DataStructureStepProps) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <FileText className="w-12 h-12 text-blue-500 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Define Data Structure
        </h2>
        <p className="text-gray-600">
          Configure the fields you want to extract from each property listing
        </p>
      </div>

      {/* Quick Actions */}
      <Card className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800">Quick Setup</h3>
        <p className="text-gray-600 text-sm">
          Get started quickly by loading test data or importing from a CSV file
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Load Test Data */}
          <div className="border rounded-md p-3 bg-gray-50">
            <h4 className="font-medium text-gray-800 mb-2 flex items-center">
              <FileSpreadsheet className="w-4 h-4 text-blue-500 mr-2" />
              Load Test Data
            </h4>
            <p className="text-xs text-gray-600 mb-3">
              Load predefined real estate fields to get started quickly
            </p>
            <button
              onClick={onLoadTestData}
              className="w-full px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            >
              Load Test Data
            </button>
          </div>

          {/* Import from CSV */}
          <div className="border rounded-md p-3 bg-gray-50">
            <h4 className="font-medium text-gray-800 mb-2 flex items-center">
              <Upload className="w-4 h-4 text-green-500 mr-2" />
              Import from CSV
            </h4>
            <p className="text-xs text-gray-600 mb-3">
              Upload a CSV file to create fields from column headers
            </p>
            <label className="block w-full px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 cursor-pointer transition-colors text-center">
              Choose CSV File
              <input
                type="file"
                accept=".csv"
                onChange={onCsvUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {csvUploadError && (
          <AlertMessage type="error" message={csvUploadError} />
        )}

        {error && <AlertMessage type="error" message={error} />}
      </Card>

      {/* Data Fields */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            Data Fields ({dataFields.length})
          </h3>
          <GradientButton onClick={onAddField} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Field
          </GradientButton>
        </div>

        <div className="space-y-3">
          {dataFields.map((field) => (
            <div key={field.id} className="border rounded-md p-3 bg-gray-50">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <FormField
                    label="Field Name"
                    value={field.name}
                    onChange={(value) => onUpdateField(field.id, "name", value)}
                    placeholder="e.g., title, price, address"
                  />
                  <FormField
                    label="Description"
                    value={field.description}
                    onChange={(value) =>
                      onUpdateField(field.id, "description", value)
                    }
                    placeholder="What this field represents"
                  />
                  <FormField
                    label="Example"
                    value={field.example}
                    onChange={(value) =>
                      onUpdateField(field.id, "example", value)
                    }
                    placeholder="Expected format/content"
                  />
                </div>
                <button
                  onClick={() => onRemoveField(field.id)}
                  className="ml-3 mt-5 p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {dataFields.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <FileText className="w-10 h-10 mx-auto mb-3 text-gray-400" />
            <p>No data fields defined yet</p>
            <p className="text-sm">
              Use Quick Setup above or click &quot;Add Field&quot; to get
              started
            </p>
          </div>
        )}

        {dataFields.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <p className="text-sm text-blue-800">
                {dataFields.filter((field) => field.name && field.description)
                  .length > 0
                  ? `✓ Ready to proceed! ${dataFields.filter((field) => field.name && field.description).length} valid field(s) configured.`
                  : `⚠ Please fill in at least one field with both name and description to continue.`}
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
