import getOrgUser from 'api/user/getOrgUser';
import ROUTES from 'constants/routes';
import history from 'lib/history';
import { isEmpty } from 'lodash-es';
import { useAppContext } from 'providers/App/App';
import { ReactChild, useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { matchPath, useLocation } from 'react-router-dom';
import { LicenseState, LicenseStatus } from 'types/api/licensesV3/getActive';
import { Organization } from 'types/api/user/getOrganization';
import { isCloudUser } from 'utils/app';
import { routePermission } from 'utils/permission';

import routes, {
	LIST_LICENSES,
	oldNewRoutesMapping,
	oldRoutes,
} from './routes';

function PrivateRoute({ children }: PrivateRouteProps): JSX.Element {
	const location = useLocation();
	const { pathname } = location;
	const {
		org,
		orgPreferences,
		user,
		isLoggedIn: isLoggedInState,
		isFetchingOrgPreferences,
		licenses,
		isFetchingLicenses,
		activeLicenseV3,
		isFetchingActiveLicenseV3,
	} = useAppContext();
	const mapRoutes = useMemo(
		() =>
			new Map(
				[...routes, LIST_LICENSES].map((e) => {
					const currentPath = matchPath(pathname, {
						path: e.path,
					});
					return [currentPath === null ? null : 'current', e];
				}),
			),
		[pathname],
	);
	const isOldRoute = oldRoutes.indexOf(pathname) > -1;
	const currentRoute = mapRoutes.get('current');
	const isCloudUserVal = isCloudUser();

	const [orgData, setOrgData] = useState<Organization | undefined>(undefined);

	const { data: orgUsers, isFetching: isFetchingOrgUsers } = useQuery({
		queryFn: () => {
			if (orgData && orgData.id !== undefined) {
				return getOrgUser({
					orgId: orgData.id,
				});
			}
			return undefined;
		},
		queryKey: ['getOrgUser'],
		enabled: !isEmpty(orgData),
	});

	const checkFirstTimeUser = useCallback((): boolean => {
		const users = orgUsers?.payload || [];

		const remainingUsers = users.filter(
			(user) => user.email !== 'admin@signoz.cloud',
		);

		return remainingUsers.length === 1;
	}, [orgUsers?.payload]);

	useEffect(() => {
		if (
			isCloudUserVal &&
			!isFetchingOrgPreferences &&
			orgPreferences &&
			!isFetchingOrgUsers &&
			orgUsers &&
			orgUsers.payload
		) {
			const isOnboardingComplete = orgPreferences?.find(
				(preference: Record<string, any>) => preference.key === 'ORG_ONBOARDING',
			)?.value;

			const isFirstUser = checkFirstTimeUser();
			if (isFirstUser && !isOnboardingComplete) {
				history.push(ROUTES.ONBOARDING);
			}
		}
	}, [
		checkFirstTimeUser,
		isCloudUserVal,
		isFetchingOrgPreferences,
		isFetchingOrgUsers,
		orgPreferences,
		orgUsers,
	]);

	const navigateToWorkSpaceBlocked = (route: any): void => {
		const { path } = route;

		if (path && path !== ROUTES.WORKSPACE_LOCKED) {
			history.push(ROUTES.WORKSPACE_LOCKED);
		}
	};

	useEffect(() => {
		if (!isFetchingLicenses) {
			const currentRoute = mapRoutes.get('current');
			const shouldBlockWorkspace = licenses?.workSpaceBlock;

			if (shouldBlockWorkspace) {
				navigateToWorkSpaceBlocked(currentRoute);
			}
		}
	}, [isFetchingLicenses, licenses?.workSpaceBlock, mapRoutes]);

	const navigateToWorkSpaceSuspended = (route: any): void => {
		const { path } = route;

		if (path && path !== ROUTES.WORKSPACE_SUSPENDED) {
			history.push(ROUTES.WORKSPACE_SUSPENDED);
		}
	};

	useEffect(() => {
		if (!isFetchingActiveLicenseV3 && activeLicenseV3) {
			const currentRoute = mapRoutes.get('current');
			const shouldSuspendWorkspace =
				activeLicenseV3.status === LicenseStatus.SUSPENDED &&
				activeLicenseV3.state === LicenseState.PAYMENT_FAILED;

			if (shouldSuspendWorkspace) {
				navigateToWorkSpaceSuspended(currentRoute);
			}
		}
	}, [isFetchingActiveLicenseV3, activeLicenseV3, mapRoutes]);

	useEffect(() => {
		if (org && org.length > 0 && org[0].id !== undefined) {
			setOrgData(org[0]);
		}
	}, [org]);

	// eslint-disable-next-line sonarjs/cognitive-complexity
	useEffect(() => {
		// if it is an old route navigate to the new route
		if (isOldRoute) {
			const redirectUrl = oldNewRoutesMapping[pathname];

			const newLocation = {
				...location,
				pathname: redirectUrl,
			};
			history.replace(newLocation);
		}

		// if the current route
		if (currentRoute) {
			const { isPrivate, key } = currentRoute;
			if (isPrivate) {
				if (isLoggedInState) {
					const route = routePermission[key];
					if (route && route.find((e) => e === user.role) === undefined) {
						history.push(ROUTES.UN_AUTHORIZED);
					}
				} else {
					history.push(ROUTES.LOGIN);
				}
			} else if (isLoggedInState) {
				history.push(ROUTES.APPLICATION);
			} else {
				// do nothing as the unauthenticated routes are LOGIN and SIGNUP and the LOGIN container takes care of routing to signup if
				// setup is not completed
			}
		} else if (isLoggedInState) {
			history.push(ROUTES.APPLICATION);
		} else {
			history.push(ROUTES.LOGIN);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [licenses, isLoggedInState, pathname, user, isOldRoute, currentRoute]);

	// NOTE: disabling this rule as there is no need to have div
	// eslint-disable-next-line react/jsx-no-useless-fragment
	return <>{children}</>;
}

interface PrivateRouteProps {
	children: ReactChild;
}

export default PrivateRoute;
