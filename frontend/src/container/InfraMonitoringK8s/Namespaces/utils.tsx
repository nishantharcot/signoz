import { Tag } from 'antd';
import { ColumnType } from 'antd/es/table';
import {
	K8sNamespacesData,
	K8sNamespacesListPayload,
} from 'api/infraMonitoring/getK8sNamespacesList';
import { Group } from 'lucide-react';
import { IBuilderQuery } from 'types/api/queryBuilder/queryBuilderData';

import { IEntityColumn } from '../utils';

export const defaultAddedColumns: IEntityColumn[] = [
	{
		label: 'Namespace Name',
		value: 'namespaceName',
		id: 'namespaceName',
		canRemove: false,
	},
	{
		label: 'Cluster Name',
		value: 'clusterName',
		id: 'clusterName',
		canRemove: false,
	},
	{
		label: 'CPU Utilization (cores)',
		value: 'cpuUsage',
		id: 'cpuUsage',
		canRemove: false,
	},
	{
		label: 'Memory Utilization (bytes)',
		value: 'memoryUsage',
		id: 'memoryUsage',
		canRemove: false,
	},
];

export interface K8sNamespacesRowData {
	key: string;
	namespaceUID: string;
	namespaceName: string;
	clusterName: string;
	cpuUsage: React.ReactNode;
	memoryUsage: React.ReactNode;
	groupedByMeta?: any;
}

const namespaceGroupColumnConfig = {
	title: (
		<div className="column-header pod-group-header">
			<Group size={14} /> NAMESPACE GROUP
		</div>
	),
	dataIndex: 'namespaceGroup',
	key: 'namespaceGroup',
	ellipsis: true,
	width: 150,
	align: 'left',
	sorter: false,
};

export const getK8sNamespacesListQuery = (): K8sNamespacesListPayload => ({
	filters: {
		items: [],
		op: 'and',
	},
	orderBy: { columnName: 'cpu', order: 'desc' },
});

const columnsConfig = [
	{
		title: <div className="column-header-left">Namespace Name</div>,
		dataIndex: 'namespaceName',
		key: 'namespaceName',
		ellipsis: true,
		width: 120,
		sorter: true,
		align: 'left',
	},
	{
		title: <div className="column-header-left">Cluster Name</div>,
		dataIndex: 'clusterName',
		key: 'clusterName',
		ellipsis: true,
		width: 120,
		sorter: true,
		align: 'left',
	},
	{
		title: <div className="column-header-left">CPU Utilization (cores)</div>,
		dataIndex: 'cpuUsage',
		key: 'cpuUsage',
		width: 100,
		sorter: true,
		align: 'left',
	},
	{
		title: <div className="column-header-left">Memory Utilization (bytes)</div>,
		dataIndex: 'memoryUsage',
		key: 'memoryUsage',
		width: 80,
		sorter: true,
		align: 'left',
	},
];

export const getK8sNamespacesListColumns = (
	groupBy: IBuilderQuery['groupBy'],
): ColumnType<K8sNamespacesRowData>[] => {
	if (groupBy.length > 0) {
		const filteredColumns = [...columnsConfig].filter(
			(column) => column.key !== 'namespaceName' && column.key !== 'clusterName',
		);
		filteredColumns.unshift(namespaceGroupColumnConfig);
		return filteredColumns as ColumnType<K8sNamespacesRowData>[];
	}

	return columnsConfig as ColumnType<K8sNamespacesRowData>[];
};

const getGroupByEle = (
	namespace: K8sNamespacesData,
	groupBy: IBuilderQuery['groupBy'],
): React.ReactNode => {
	const groupByValues: string[] = [];

	groupBy.forEach((group) => {
		groupByValues.push(namespace.meta[group.key as keyof typeof namespace.meta]);
	});

	return (
		<div className="pod-group">
			{groupByValues.map((value) => (
				<Tag key={value} color="#1D212D" className="pod-group-tag-item">
					{value === '' ? '<no-value>' : value}
				</Tag>
			))}
		</div>
	);
};

export const formatDataForTable = (
	data: K8sNamespacesData[],
	groupBy: IBuilderQuery['groupBy'],
): K8sNamespacesRowData[] =>
	data.map((namespace, index) => ({
		key: `${namespace.namespaceName}-${index}`,
		namespaceUID: namespace.meta.k8s_namespace_uid,
		namespaceName: namespace.namespaceName,
		clusterName: namespace.meta.k8s_cluster_name,
		cpuUsage: namespace.cpuUsage,
		memoryUsage: namespace.memoryUsage,
		namespaceGroup: getGroupByEle(namespace, groupBy),
		meta: namespace.meta,
		...namespace.meta,
		groupedByMeta: namespace.meta,
	}));
