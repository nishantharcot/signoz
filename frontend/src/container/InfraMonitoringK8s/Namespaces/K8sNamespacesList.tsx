/* eslint-disable @typescript-eslint/explicit-function-return-type */
import '../InfraMonitoringK8s.styles.scss';

import { LoadingOutlined } from '@ant-design/icons';
import {
	Skeleton,
	Spin,
	Table,
	TablePaginationConfig,
	TableProps,
	Typography,
} from 'antd';
import { SorterResult } from 'antd/es/table/interface';
import logEvent from 'api/common/logEvent';
import { K8sNamespacesListPayload } from 'api/infraMonitoring/getK8sNamespacesList';
import { useGetK8sNamespacesList } from 'hooks/infraMonitoring/useGetK8sNamespacesList';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from 'store/reducers';
import { IBuilderQuery } from 'types/api/queryBuilder/queryBuilderData';
import { GlobalReducer } from 'types/reducer/globalTime';

import K8sHeader from '../K8sHeader';
import {
	defaultAddedColumns,
	formatDataForTable,
	getK8sNamespacesListColumns,
	getK8sNamespacesListQuery,
	K8sNamespacesRowData,
} from './utils';

function K8sNamespacesList({
	isFiltersVisible,
	handleFilterVisibilityChange,
}: {
	isFiltersVisible: boolean;
	handleFilterVisibilityChange: () => void;
}): JSX.Element {
	const { maxTime, minTime } = useSelector<AppState, GlobalReducer>(
		(state) => state.globalTime,
	);

	const [currentPage, setCurrentPage] = useState(1);

	const [filters, setFilters] = useState<IBuilderQuery['filters']>({
		items: [],
		op: 'and',
	});

	const [orderBy, setOrderBy] = useState<{
		columnName: string;
		order: 'asc' | 'desc';
	} | null>(null);

	// const [selectedNamespaceUID, setselectedNamespaceUID] = useState<string | null>(null);

	const pageSize = 10;

	const query = useMemo(() => {
		const baseQuery = getK8sNamespacesListQuery();
		return {
			...baseQuery,
			limit: pageSize,
			offset: (currentPage - 1) * pageSize,
			filters,
			start: Math.floor(minTime / 1000000),
			end: Math.floor(maxTime / 1000000),
			orderBy,
		};
	}, [currentPage, filters, minTime, maxTime, orderBy]);

	const { data, isFetching, isLoading, isError } = useGetK8sNamespacesList(
		query as K8sNamespacesListPayload,
		{
			queryKey: ['hostList', query],
			enabled: !!query,
		},
	);

	const NamespacesData = useMemo(() => data?.payload?.data?.records || [], [
		data,
	]);
	const totalCount = data?.payload?.data?.total || 0;

	const formattedNamespacesData = useMemo(
		() => formatDataForTable(NamespacesData),
		[NamespacesData],
	);

	const columns = useMemo(() => getK8sNamespacesListColumns(), []);

	const handleTableChange: TableProps<K8sNamespacesRowData>['onChange'] = useCallback(
		(
			pagination: TablePaginationConfig,
			_filters: Record<string, (string | number | boolean)[] | null>,
			sorter:
				| SorterResult<K8sNamespacesRowData>
				| SorterResult<K8sNamespacesRowData>[],
		): void => {
			if (pagination.current) {
				setCurrentPage(pagination.current);
			}

			if ('field' in sorter && sorter.order) {
				setOrderBy({
					columnName: sorter.field as string,
					order: sorter.order === 'ascend' ? 'asc' : 'desc',
				});
			} else {
				setOrderBy(null);
			}
		},
		[],
	);

	const handleFiltersChange = useCallback(
		(value: IBuilderQuery['filters']): void => {
			const isNewFilterAdded = value.items.length !== filters.items.length;
			if (isNewFilterAdded) {
				setFilters(value);
				setCurrentPage(1);

				logEvent('Infra Monitoring: K8s list filters applied', {
					filters: value,
				});
			}
		},
		[filters],
	);

	useEffect(() => {
		logEvent('Infra Monitoring: K8s list page visited', {});
	}, []);

	// const selectedNamespaceData = useMemo(() => {
	// 	if (!selectedNamespaceUID) return null;
	// 	return NamespacesData.find((Namespace) => Namespace.NamespaceUID === selectedNamespaceUID) || null;
	// }, [selectedNamespaceUID, NamespacesData]);

	const handleRowClick = (record: K8sNamespacesRowData): void => {
		// setselectedNamespaceUID(record.NamespaceUID);

		logEvent('Infra Monitoring: K8s Namespace list item clicked', {
			namespaceName: record.namespaceName,
		});
	};

	// const handleCloseNamespaceDetail = (): void => {
	// 	setselectedNamespaceUID(null);
	// };

	const showsNamespacesTable =
		!isError &&
		!isLoading &&
		!isFetching &&
		!(formattedNamespacesData.length === 0 && filters.items.length > 0);

	const showNoFilteredNamespacesMessage =
		!isFetching &&
		!isLoading &&
		formattedNamespacesData.length === 0 &&
		filters.items.length > 0;

	return (
		<div className="k8s-list">
			<K8sHeader
				isFiltersVisible={isFiltersVisible}
				handleFilterVisibilityChange={handleFilterVisibilityChange}
				defaultAddedColumns={defaultAddedColumns}
				addedColumns={[]}
				availableColumns={[]}
				handleFiltersChange={handleFiltersChange}
				onAddColumn={() => {}}
				onRemoveColumn={() => {}}
			/>
			{isError && <Typography>{data?.error || 'Something went wrong'}</Typography>}

			{showNoFilteredNamespacesMessage && (
				<div className="no-filtered-hosts-message-container">
					<div className="no-filtered-hosts-message-content">
						<img
							src="/Icons/emptyState.svg"
							alt="thinking-emoji"
							className="empty-state-svg"
						/>

						<Typography.Text className="no-filtered-hosts-message">
							This query had no results. Edit your query and try again!
						</Typography.Text>
					</div>
				</div>
			)}

			{(isFetching || isLoading) && (
				<div className="k8s-list-loading-state">
					<Skeleton.Input
						className="k8s-list-loading-state-item"
						size="large"
						block
						active
					/>
					<Skeleton.Input
						className="k8s-list-loading-state-item"
						size="large"
						block
						active
					/>
					<Skeleton.Input
						className="k8s-list-loading-state-item"
						size="large"
						block
						active
					/>
				</div>
			)}

			{showsNamespacesTable && (
				<Table
					className="k8s-list-table"
					dataSource={isFetching || isLoading ? [] : formattedNamespacesData}
					columns={columns}
					pagination={{
						current: currentPage,
						pageSize,
						total: totalCount,
						showSizeChanger: false,
						hideOnSinglePage: true,
					}}
					scroll={{ x: true }}
					loading={{
						spinning: isFetching || isLoading,
						indicator: <Spin indicator={<LoadingOutlined size={14} spin />} />,
					}}
					tableLayout="fixed"
					rowKey={(record): string => record.namespaceName}
					onChange={handleTableChange}
					onRow={(record): { onClick: () => void; className: string } => ({
						onClick: (): void => handleRowClick(record),
						className: 'clickable-row',
					})}
				/>
			)}
			{/* TODO - Handle Namespace Details flow */}
		</div>
	);
}

export default K8sNamespacesList;
