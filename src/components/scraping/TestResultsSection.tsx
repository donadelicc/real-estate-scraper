import React from "react";
import { Play, CheckCircle, Clock } from "lucide-react";
import Card from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import AlertMessage from "@/components/ui/AlertMessage";

interface ScrapingConfig {
  dataFields: Array<{
    id: string;
    name: string;
    description: string;
    example: string;
  }>;
}

interface TestResultsSectionProps {
  isTesting: boolean;
  testProgress: {
    current: number;
    total: number;
    currentUrl: string;
    results: {
      url: string;
      data: Record<string, unknown> | null;
      error?: string;
      processingTime: number;
    }[];
    isComplete: boolean;
    error?: string;
  } | null;
  scrapingConfig: ScrapingConfig | null;
}

export default function TestResultsSection({
  isTesting,
  testProgress,
  scrapingConfig,
}: TestResultsSectionProps) {
  if (!isTesting && !testProgress) {
    return null;
  }

  const baseColumns = [
    {
      key: "_system_index",
      label: "#",
      width: "50px",
      className: "text-center",
    },
    {
      key: "_system_url",
      label: "URL",
      className: "min-w-[200px]",
      render: (value: unknown, row: Record<string, unknown>) => (
        <a
          href={row._system_url as string}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline font-mono"
          title={row._system_url as string}
        >
          {(row._system_url as string).length > 50
            ? `${(row._system_url as string).substring(0, 50)}...`
            : (row._system_url as string)}
        </a>
      ),
    },
    {
      key: "_system_status",
      label: "Status",
      width: "80px",
      className: "text-center",
      render: (value: unknown, row: Record<string, unknown>) => (
        <StatusBadge
          status={
            row._system_status as "success" | "error" | "warning" | "pending"
          }
          showIcon={true}
          size="sm"
        />
      ),
    },
  ];

  const dataFieldColumns =
    scrapingConfig?.dataFields?.map((field) => ({
      key: `field_${field.name}`, // Prefix to avoid conflicts
      label: field.name,
      className: "min-w-[120px]",
      render: (value: unknown, row: Record<string, unknown>) =>
        row._system_hasData ? (
          <span className="text-sm">
            {row[`field_${field.name}`] ? (
              String(row[`field_${field.name}`])
            ) : (
              <span className="text-gray-400 italic">-</span>
            )}
          </span>
        ) : (
          <span className="text-gray-400 italic text-xs">Error</span>
        ),
    })) ?? [];

  const columns = [
    ...baseColumns,
    ...dataFieldColumns,
    {
      key: "_system_processingTime",
      label: "Time (ms)",
      width: "100px",
      className: "text-center text-xs",
    },
  ];

  // Transform data to match the new key structure
  const tableData =
    testProgress?.results.map((result, index) => {
      const transformedData: Record<string, unknown> = {
        _system_index: index + 1,
        _system_url: result.url,
        _system_status: result.data ? "success" : "error",
        _system_processingTime: result.processingTime,
        _system_hasData: !!result.data,
      };

      // Add user data fields with prefixed keys
      if (result.data && scrapingConfig?.dataFields) {
        scrapingConfig.dataFields.forEach((field) => {
          transformedData[`field_${field.name}`] = result.data![field.name];
        });
      }

      return transformedData;
    }) || [];

  return (
    <div className="mt-8">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Play className="w-5 h-5 text-green-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">
              Test Scraping Results
            </h2>
          </div>

          {testProgress && (
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Progress: {testProgress.current}/{testProgress.total}
              </div>
              {isTesting && !testProgress.isComplete && (
                <StatusBadge status="pending" text="Processing..." />
              )}
              {testProgress.isComplete && (
                <StatusBadge status="success" text="Complete!" />
              )}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {testProgress && (
          <div className="mb-6">
            <ProgressBar
              current={testProgress.current}
              total={testProgress.total}
              currentLabel={
                testProgress.currentUrl
                  ? `Processing: ${testProgress.currentUrl.length > 50 ? `${testProgress.currentUrl.substring(0, 50)}...` : testProgress.currentUrl}`
                  : testProgress.isComplete
                    ? "Complete!"
                    : "Processing URLs..."
              }
            />
          </div>
        )}

        {/* Error Display */}
        {testProgress?.error && (
          <div className="mb-6">
            <AlertMessage type="error" message={testProgress.error} />
          </div>
        )}

        {/* Results Table */}
        {testProgress && testProgress.results.length > 0 && (
          <DataTable
            columns={columns}
            data={tableData}
            emptyMessage="No test results available"
          />
        )}

        {/* Summary */}
        {testProgress && testProgress.isComplete && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-gray-600">
                  {testProgress.results.filter((r) => r.data !== null).length}{" "}
                  successful
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-4 h-4 text-red-500" />
                <span className="text-gray-600">
                  {testProgress.results.filter((r) => r.data === null).length}{" "}
                  failed
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-gray-600">
                  Avg:{" "}
                  {Math.round(
                    testProgress.results.reduce(
                      (acc, r) => acc + r.processingTime,
                      0,
                    ) / testProgress.results.length,
                  )}
                  ms
                </span>
              </div>
            </div>

            {testProgress.results.filter((r) => r.data !== null).length > 0 && (
              <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm">
                Export Test Results
              </button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
