import './TraceDetails.styles.scss';

import { FilterOutlined } from '@ant-design/icons';
import { Button, Col, Layout, Typography } from 'antd';
import cx from 'classnames';
import {
	StyledCol,
	StyledDiv,
	StyledDivider,
	StyledRow,
	StyledSpace,
	StyledTypography,
} from 'components/Styled';
import { Flex, Spacing } from 'components/Styled/styles';
import GanttChart, { ITraceMetaData } from 'container/GantChart';
import { getNodeById } from 'container/GantChart/utils';
import Timeline from 'container/Timeline';
import TraceFlameGraph from 'container/TraceFlameGraph';
import dayjs from 'dayjs';
import { useIsDarkMode } from 'hooks/useDarkMode';
import useUrlQuery from 'hooks/useUrlQuery';
import { spanServiceNameToColorMapping } from 'lib/getRandomColor';
import history from 'lib/history';
import { map } from 'lodash-es';
import { SPAN_DETAILS_LEFT_COL_WIDTH } from 'pages/TraceDetail/constants';
import { useEffect, useMemo, useState } from 'react';
import { ITraceForest, PayloadProps } from 'types/api/trace/getTraceItem';
import { getSpanTreeMetadata } from 'utils/getSpanTreeMetadata';
import { spanToTreeUtil } from 'utils/spanToTree';

import MissingSpansMessage from './Missingtrace';
import SelectedSpanDetails from './SelectedSpanDetails';
import * as styles from './styles';
import { FlameGraphMissingSpansContainer, GanttChartWrapper } from './styles';
import SubTreeMessage from './SubTree';
import {
	formUrlParams,
	getSortedData,
	getTreeLevelsCount,
	IIntervalUnit,
	INTERVAL_UNITS,
} from './utils';

const { Sider } = Layout;

function TraceDetail({ response }: TraceDetailProps): JSX.Element {
	// map the color for service name
	const spanServiceColors = useMemo(
		() => spanServiceNameToColorMapping(response[0].events),
		[response],
	);

	// start of the timeline
	const traceStartTime = useMemo(() => response[0].startTimestampMillis, [
		response,
	]);

	// end of the timeline
	const traceEndTime = useMemo(() => response[0].endTimestampMillis, [response]);

	const urlQuery = useUrlQuery();

	// why is this a state ?
	const [spanId] = useState<string | null>(urlQuery.get('spanId'));

	const [intervalUnit, setIntervalUnit] = useState<IIntervalUnit>(
		INTERVAL_UNITS[0],
	);
	const [activeHoverId, setActiveHoverId] = useState<string>('');
	const [activeSelectedId, setActiveSelectedId] = useState<string>(spanId || '');
	const { levelDown, levelUp } = useMemo(
		() => ({
			levelDown: urlQuery.get('levelDown'),
			levelUp: urlQuery.get('levelUp'),
		}),
		[urlQuery],
	);
	// first conversion of spans from API response to tree structure!
	const [treesData, setTreesData] = useState<ITraceForest>(
		spanToTreeUtil(response[0].events),
	);
	// get the trace root from the above calculation and the missing span tree roots as well!

	const { treesData: tree, ...traceMetaData } = useMemo(() => {
		const sortedTreesData: ITraceForest = {
			// this sorts the children based in the startTime.
			// perf - rather than doing it here add it to an ordered map in while creating the tree ? think
			spanTree: map(treesData.spanTree, (tree) => getSortedData(tree)),
			missingSpanTree: map(
				treesData.missingSpanTree,
				(tree) => getSortedData(tree) || [],
			),
		};
		// Note: Handle undefined
		/*eslint-disable */
		// get the global start / end / levels and spread from the traversal!
		return getSpanTreeMetadata(sortedTreesData, spanServiceColors);
		/* eslint-enable */
	}, [treesData, spanServiceColors]);

	const firstSpanStartTime = tree.spanTree[0]?.startTime;

	// again why this is a state ??
	const [globalTraceMetadata] = useState<ITraceMetaData>({
		...traceMetaData,
	});

	useEffect(() => {
		if (activeSelectedId) {
			history.replace({
				pathname: history.location.pathname,
				search: `${formUrlParams({
					spanId: activeSelectedId,
					levelUp,
					levelDown,
				})}`,
			});
		}
	}, [activeSelectedId, levelDown, levelUp]);

	const getSelectedNode = useMemo(
		() => getNodeById(activeSelectedId, treesData),
		[activeSelectedId, treesData],
	);

	// every node is a root node just update the root node to the focus node
	const onFocusSelectedSpanHandler = (): void => {
		const treeNode = getNodeById(activeSelectedId, tree);

		if (treeNode) {
			setTreesData(treeNode);
		}
	};

	// make the original root as the root of the trace tree
	const onResetHandler = (): void => {
		setTreesData(spanToTreeUtil(response[0].events));
	};

	const hasMissingSpans = useMemo(
		(): boolean =>
			tree.missingSpanTree &&
			Array.isArray(tree.missingSpanTree) &&
			tree.missingSpanTree.length > 0,
		[tree],
	);

	const isGlobalTimeVisible = tree && traceMetaData.globalStart;
	const [collapsed, setCollapsed] = useState(false);

	const isDarkMode = useIsDarkMode();

	return (
		<StyledRow styledclass={[Flex({ flex: 1 })]}>
			<StyledCol flex="auto" styledclass={styles.leftContainer}>
				<StyledRow styledclass={styles.flameAndTimelineContainer}>
					{/* the left width is fixed here to 350px which will also be the offset for the trace timeline! */}
					<StyledCol
						styledclass={styles.traceMetaDataContainer}
						flex={`${SPAN_DETAILS_LEFT_COL_WIDTH}px`}
					>
						<StyledTypography.Title styledclass={[styles.removeMargin]} level={5}>
							Trace Details
						</StyledTypography.Title>
						<StyledTypography.Text styledclass={[styles.removeMargin]}>
							{traceMetaData.totalSpans} Spans
						</StyledTypography.Text>
						{hasMissingSpans && <MissingSpansMessage />}
						{response[0]?.isSubTree && <SubTreeMessage />}
					</StyledCol>
					{/* <Col flex="auto">
						{map(tree.spanTree, (tree) => (
							<TraceFlameGraph
								key={tree.id}
								treeData={tree}
								traceMetaData={traceMetaData}
								hoveredSpanId={activeHoverId}
								selectedSpanId={activeSelectedId}
								onSpanHover={setActiveHoverId}
								onSpanSelect={setActiveSelectedId}
								missingSpanTree={false}
							/>
						))}

						{hasMissingSpans && (
							<FlameGraphMissingSpansContainer>
								{map(tree.missingSpanTree, (tree) => (
									<TraceFlameGraph
										key={tree.id}
										treeData={tree}
										traceMetaData={{
											...traceMetaData,
											levels: getTreeLevelsCount(tree),
										}}
										hoveredSpanId={activeHoverId}
										selectedSpanId={activeSelectedId}
										onSpanHover={setActiveHoverId}
										onSpanSelect={setActiveSelectedId}
										missingSpanTree
									/>
								))}
							</FlameGraphMissingSpansContainer>
						)}
					</Col> */}
				</StyledRow>
				<StyledRow styledclass={[styles.traceDateAndTimelineContainer]}>
					{isGlobalTimeVisible && (
						<styles.TimeStampContainer flex={`${SPAN_DETAILS_LEFT_COL_WIDTH}px`}>
							<Typography>
								{dayjs(traceMetaData.globalStart).format('hh:mm:ss a MM/DD')}
							</Typography>
						</styles.TimeStampContainer>
					)}

					<StyledCol flex="auto" styledclass={[styles.timelineContainer]}>
						<Timeline
							globalTraceMetadata={globalTraceMetadata}
							traceMetaData={traceMetaData}
							setIntervalUnit={setIntervalUnit}
						/>
					</StyledCol>
					<StyledDivider styledclass={[styles.verticalSeparator]} />
				</StyledRow>
				<StyledRow
					styledclass={[
						styles.traceDetailContentSpacing,
						Spacing({
							margin: '1.5rem 1rem 0.5rem',
						}),
					]}
				>
					<Col flex={`${SPAN_DETAILS_LEFT_COL_WIDTH}px`} />
					<Col flex="auto">
						<StyledSpace styledclass={[styles.floatRight]}>
							<Button
								onClick={onFocusSelectedSpanHandler}
								icon={<FilterOutlined />}
								data-testid="span-focus-btn"
							>
								Focus on selected span
							</Button>
							<Button
								type="default"
								onClick={onResetHandler}
								data-testid="reset-focus"
							>
								Reset Focus
							</Button>
						</StyledSpace>
					</Col>
				</StyledRow>
				<StyledDiv styledclass={[styles.ganttChartContainer]}>
					<GanttChartWrapper>
						{map([...tree.spanTree, ...tree.missingSpanTree], (tree) => (
							<GanttChart
								key={tree as never}
								traceMetaData={traceMetaData}
								data={tree}
								activeSelectedId={activeSelectedId}
								activeHoverId={activeHoverId}
								setActiveHoverId={setActiveHoverId}
								setActiveSelectedId={setActiveSelectedId}
								spanId={spanId || ''}
								intervalUnit={intervalUnit}
							/>
						))}
					</GanttChartWrapper>
				</StyledDiv>
			</StyledCol>

			<Col>
				<StyledDivider styledclass={[styles.verticalSeparator]} type="vertical" />
			</Col>

			<Sider
				className={cx('span-details-sider', isDarkMode ? 'dark' : 'light')}
				style={{ background: isDarkMode ? '#0b0c0e' : '#fff' }}
				theme={isDarkMode ? 'dark' : 'light'}
				collapsible
				collapsed={collapsed}
				reverseArrow
				width={300}
				collapsedWidth={40}
				defaultCollapsed
				onCollapse={(value): void => setCollapsed(value)}
				data-testid="span-details-sider"
			>
				{!collapsed && (
					<StyledCol styledclass={[styles.selectedSpanDetailContainer]}>
						<SelectedSpanDetails
							firstSpanStartTime={firstSpanStartTime}
							traceStartTime={traceStartTime}
							traceEndTime={traceEndTime}
							tree={[
								...(getSelectedNode.spanTree ? getSelectedNode.spanTree : []),
								...(getSelectedNode.missingSpanTree
									? getSelectedNode.missingSpanTree
									: []),
							]
								.filter(Boolean)
								.find((tree) => tree)}
						/>
					</StyledCol>
				)}
			</Sider>
		</StyledRow>
	);
}

interface TraceDetailProps {
	response: PayloadProps;
}

export default TraceDetail;
