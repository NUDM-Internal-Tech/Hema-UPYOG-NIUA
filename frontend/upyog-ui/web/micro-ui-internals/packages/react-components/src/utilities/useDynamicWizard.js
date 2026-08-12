/**
 * useDynamicWizard.js
 *
 * Shared React hook for DynamicForm create wizards (one-step OR multi-step).
 * Same responsibilities as module-specific hooks (e.g. EST useEstWizard), but
 * generic — any module can pass local JSON or MDMS data.
 *
 * Responsibilities
 * ----------------
 * 1. Flatten wizard config via buildWizardSteps.
 * 2. Persist step data in session storage.
 * 3. On Save & Next: mergeSessionStepWithRouteConfig + goNext.
 * 4. On check success / error: clear session and navigate to acknowledgement.
 *
 * Typical usage
 * -------------
 *   const { config, params, handleSelect, onCheckSuccess, isReady } = useDynamicWizard({
 *     wizardConfig: localJson,          // or MDMS array
 *     indexRoute: "basic",
 *     sessionKey: "DEMO_MULTI_WIZARD",
 *     terminalSegments: ["basic", "contact", "documents", "check", "acknowledgement"],
 *     multiStepNavigation: true,
 *   });
 *
 * @see buildWizardSteps
 * @see createWizardGoNext
 * @see mergeSessionStepWithRouteConfig
 */

import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { mergeSessionStepWithRouteConfig } from "./checkPageUtils";
import {
  buildWizardSteps,
  createWizardGoNext,
  getWizardBasePath,
} from "./wizardUtils";

/**
 * @param {object}   options
 * @param {Array}    options.wizardConfig           MDMS/local JSON master array.
 * @param {boolean}  [options.isLoading=false]      True while remote config loads.
 * @param {string}   options.indexRoute             First fill step route name.
 * @param {string}   options.sessionKey             useSessionStorage key.
 * @param {string[]} options.terminalSegments       Path segments that end a fill route.
 * @param {boolean}  [options.multiStepNavigation=true]
 * @param {string|string[]} [options.invalidateQueryKey] Optional react-query key to invalidate.
 * @param {Function} [options.buildSuccessAckState] (response, params) => ack location state
 * @returns {object} Wizard API for index pages (config, handleSelect, …).
 */
const useDynamicWizard = ({
  wizardConfig,
  isLoading = false,
  indexRoute,
  sessionKey,
  terminalSegments,
  multiStepNavigation = true,
  invalidateQueryKey,
  buildSuccessAckState,
}) => {
  const location = useLocation();
  const { pathname } = location;
  const navigate = Digit.Hooks.useCustomNavigate();
  const match = Digit.Hooks.useModuleBasePath();
  const queryClient = useQueryClient();

  const [params, setParams, clearParams] = Digit.Hooks.useSessionStorage(sessionKey, {});

  const config = useMemo(
    () => buildWizardSteps(wizardConfig, indexRoute),
    [wizardConfig, indexRoute]
  );

  const getBasePath = useCallback(
    () => getWizardBasePath(pathname, match?.pathnameBase, terminalSegments),
    [pathname, match, terminalSegments]
  );

  const goNext = useCallback(
    createWizardGoNext({
      pathname,
      config,
      navigate,
      multiStep: multiStepNavigation,
    }),
    [pathname, config, navigate, multiStepNavigation]
  );

  /**
   * DynamicFormStep onSelect sink.
   * Saves step payload (+ routeConfig snapshot) then advances to nextStep or /check.
   */
  const handleSelect = useCallback(
    (key, data, skipStep, index, isAddMultiple = false) => {
      setParams((prev) => mergeSessionStepWithRouteConfig(prev, key, data));
      goNext(skipStep, index, isAddMultiple, key);
    },
    [setParams, goNext]
  );

  const onAckSuccess = useCallback(() => {
    clearParams();
    if (invalidateQueryKey) queryClient.invalidateQueries(invalidateQueryKey);
  }, [clearParams, queryClient, invalidateQueryKey]);

  const onCheckSuccess = useCallback(
    (response) => {
      // Build ack payload from session BEFORE clearing — PDF/ack may need routeConfigs.
      let ackState = { data: response, isSuccess: true };
      try {
        if (buildSuccessAckState) {
          ackState = buildSuccessAckState(response, params);
          if (!ackState || typeof ackState !== "object") {
            ackState = { data: response, isSuccess: true };
          }
          ackState = { ...ackState, isSuccess: true };
        }
      } catch (err) {
        console.error("Wizard ack state build failed after successful submit:", err);
        ackState = {
          data: response,
          isSuccess: true,
          ackBuildError: String(err?.message || err),
        };
      }

      clearParams();
      if (invalidateQueryKey) queryClient.invalidateQueries(invalidateQueryKey);
      navigate(`${getBasePath()}/acknowledgement`, { state: ackState });
    },
    [
      clearParams,
      queryClient,
      invalidateQueryKey,
      buildSuccessAckState,
      params,
      navigate,
      getBasePath,
    ]
  );

  const onCheckError = useCallback(
    (error) => {
      navigate(`${getBasePath()}/acknowledgement`, {
        state: {
          data: null,
          isSuccess: false,
          error: {
            message: error?.message || "COMMON_APPLICATION_FAILED",
            status: error?.response?.status,
          },
        },
      });
    },
    [navigate, getBasePath]
  );

  const isReady = !isLoading && Array.isArray(wizardConfig) && config.length > 0;

  return {
    config,
    params,
    setParams,
    clearParams,
    location,
    match,
    getBasePath,
    goNext,
    handleSelect,
    onAckSuccess,
    onCheckSuccess,
    onCheckError,
    isReady,
  };
};

export default useDynamicWizard;
