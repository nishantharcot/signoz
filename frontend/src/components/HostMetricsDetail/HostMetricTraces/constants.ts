import { PANEL_TYPES } from 'constants/queryBuilder';
import { GetQueryResultsProps } from 'lib/dashboard/getQueryResults';
import { DataTypes } from 'types/api/queryBuilder/queryAutocompleteResponse';
import { EQueryType } from 'types/common/dashboard';
import { DataSource } from 'types/common/queryBuilder';

import { formatNanoToMS } from './utils';

export const columns = [
	{
		dataIndex: 'timestamp',
		key: 'timestamp',
		title: 'Timestamp',
		width: 145,
		render: (timestamp: string): string => new Date(timestamp).toLocaleString(),
	},
	{
		title: 'Service Name',
		dataIndex: ['data', 'serviceName'],
		key: 'serviceName-string-tag',
		width: 145,
	},
	{
		title: 'Name',
		dataIndex: ['data', 'name'],
		key: 'name-string-tag',
		width: 145,
	},
	{
		title: 'Duration',
		dataIndex: ['data', 'durationNano'],
		key: 'durationNano-float64-tag',
		width: 145,
		render: (duration: number): string => `${formatNanoToMS(duration)}`,
	},
	{
		title: 'HTTP Method',
		dataIndex: ['data', 'httpMethod'],
		key: 'httpMethod-string-tag',
		width: 145,
	},
	{
		title: 'Status Code',
		dataIndex: ['data', 'responseStatusCode'],
		key: 'responseStatusCode-string-tag',
		width: 145,
	},
];

export const getHostTracesQueryPayload = (
	hostName: string,
	start: number,
	end: number,
	offset = 0,
): GetQueryResultsProps => ({
	query: {
		promql: [],
		clickhouse_sql: [],
		builder: {
			queryData: [
				{
					dataSource: DataSource.TRACES,
					queryName: 'A',
					aggregateOperator: 'noop',
					aggregateAttribute: {
						id: '------false',
						dataType: DataTypes.EMPTY,
						key: '',
						isColumn: false,
						type: '',
						isJSON: false,
					},
					timeAggregation: 'rate',
					spaceAggregation: 'sum',
					functions: [],
					filters: {
						items: [
							{
								id: 'host-filter',
								key: {
									key: 'host.name',
									dataType: DataTypes.String,
									type: 'resource',
									isColumn: false,
									isJSON: false,
									id: 'host.name--string--resource--false',
								},
								op: '=',
								value: hostName,
							},
						],
						op: 'AND',
					},
					expression: 'A',
					disabled: false,
					stepInterval: 60,
					having: [],
					limit: null,
					orderBy: [
						{
							columnName: 'timestamp',
							order: 'desc',
						},
					],
					groupBy: [],
					legend: '',
					reduceTo: 'avg',
				},
			],
			queryFormulas: [],
		},
		id: '572f1d91-6ac0-46c0-b726-c21488b34434',
		queryType: EQueryType.QUERY_BUILDER,
	},
	graphType: PANEL_TYPES.LIST,
	selectedTime: 'GLOBAL_TIME',
	params: {
		dataSource: DataSource.TRACES,
	},
	tableParams: {
		pagination: {
			limit: 10,
			offset,
		},
		selectColumns: [
			{
				key: 'serviceName',
				dataType: 'string',
				type: 'tag',
				isColumn: true,
				isJSON: false,
				id: 'serviceName--string--tag--true',
				isIndexed: false,
			},
			{
				key: 'name',
				dataType: 'string',
				type: 'tag',
				isColumn: true,
				isJSON: false,
				id: 'name--string--tag--true',
				isIndexed: false,
			},
			{
				key: 'durationNano',
				dataType: 'float64',
				type: 'tag',
				isColumn: true,
				isJSON: false,
				id: 'durationNano--float64--tag--true',
				isIndexed: false,
			},
			{
				key: 'httpMethod',
				dataType: 'string',
				type: 'tag',
				isColumn: true,
				isJSON: false,
				id: 'httpMethod--string--tag--true',
				isIndexed: false,
			},
			{
				key: 'responseStatusCode',
				dataType: 'string',
				type: 'tag',
				isColumn: true,
				isJSON: false,
				id: 'responseStatusCode--string--tag--true',
				isIndexed: false,
			},
		],
	},
});