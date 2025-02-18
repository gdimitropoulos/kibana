/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { FormEvent } from 'react';

import { useActions, useValues } from 'kea';

import {
  EuiButton,
  EuiButtonEmpty,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiFormRow,
  EuiLink,
  EuiSpacer,
  EuiSteps,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';

import { LicensingLogic } from '../../../../../shared/licensing';
import { ApiKey } from '../../../../components/shared/api_key';
import { PUBLIC_KEY_LABEL, CONSUMER_KEY_LABEL, REMOVE_BUTTON } from '../../../../constants';

import { Configuration } from '../../../../types';

import { ExternalConnectorFormFields } from './add_external_connector';
import { AddSourceLogic, SourceConfigFormElement } from './add_source_logic';
import { ConfigDocsLinks } from './config_docs_links';
import { OAUTH_SAVE_CONFIG_BUTTON, OAUTH_BACK_BUTTON } from './constants';

const getInternalConnectorConfigurableFields = (
  configuration: Configuration
): SourceConfigFormElement[] => {
  const internalConnectorFields: SourceConfigFormElement[] = [
    {
      key: 'client_id',
      label: i18n.translate(
        'xpack.enterpriseSearch.workplaceSearch.contentSource.saveConfig.clientIDLabel',
        {
          defaultMessage: 'Client ID',
        }
      ),
    },
    {
      key: 'client_secret',
      label: i18n.translate(
        'xpack.enterpriseSearch.workplaceSearch.contentSource.saveConfig.clientSecretLabel',
        {
          defaultMessage: 'Client Secret',
        }
      ),
    },
  ];

  return configuration.needsBaseUrl
    ? [
        ...internalConnectorFields,
        {
          key: 'base_url',
          label: i18n.translate(
            'xpack.enterpriseSearch.workplaceSearch.contentSource.saveConfig.baseUrlLabel',
            {
              defaultMessage: 'Base URL',
            }
          ),
        },
      ]
    : internalConnectorFields;
};

interface SaveConfigProps {
  header: React.ReactNode;
  name: string;
  configuration: Configuration;
  advanceStep(): void;
  goBackStep?(): void;
  onDeleteConfig?(): void;
}

export const SaveConfig: React.FC<SaveConfigProps> = ({
  name,
  configuration,
  advanceStep,
  goBackStep,
  onDeleteConfig,
  header,
}) => {
  const { documentationUrl, applicationPortalUrl, applicationLinkTitle } = configuration;

  const { hasPlatinumLicense } = useValues(LicensingLogic);

  const { setConfiguredField } = useActions(AddSourceLogic);

  const { sourceConfigData, buttonLoading, configuredFields } = useValues(AddSourceLogic);

  const { accountContextOnly, serviceType, configured, configurableFields = [] } = sourceConfigData;

  const formFields: SourceConfigFormElement[] =
    serviceType === 'external'
      ? configurableFields
      : getInternalConnectorConfigurableFields(configuration);

  const handleFormSubmission = (e: FormEvent) => {
    e.preventDefault();
    advanceStep();
  };

  const saveButton = (
    <EuiButton color="primary" fill isLoading={buttonLoading} type="submit">
      {OAUTH_SAVE_CONFIG_BUTTON}
    </EuiButton>
  );

  const deleteButton = (
    <EuiButton color="danger" fill disabled={buttonLoading} onClick={onDeleteConfig}>
      {REMOVE_BUTTON}
    </EuiButton>
  );

  const backButton = <EuiButtonEmpty onClick={goBackStep}>{OAUTH_BACK_BUTTON}</EuiButtonEmpty>;
  const showSaveButton = hasPlatinumLicense || !accountContextOnly;

  const formActions = (
    <EuiFormRow>
      <EuiFlexGroup justifyContent="flexStart" gutterSize="m" responsive={false}>
        {showSaveButton && <EuiFlexItem grow={false}>{saveButton}</EuiFlexItem>}
        <EuiFlexItem grow={false}>
          {goBackStep && backButton}
          {onDeleteConfig && deleteButton}
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiFormRow>
  );

  const oauthStep = {
    title: i18n.translate(
      'xpack.enterpriseSearch.workplaceSearch.contentSource.saveConfig.oauthStep1',
      {
        defaultMessage: "Create an OAuth app in your organization's {sourceName} account",
        values: { sourceName: name },
      }
    ),
    children: (
      <EuiFlexGroup justifyContent="flexStart" direction="column" responsive={false}>
        <ConfigDocsLinks
          name={name}
          documentationUrl={documentationUrl}
          applicationPortalUrl={applicationPortalUrl}
          applicationLinkTitle={applicationLinkTitle}
        />
        {configuredFields.public_key && configuredFields.consumer_key && (
          <>
            <EuiSpacer />
            <EuiFlexGroup direction="column" justifyContent="flexStart" responsive={false}>
              <EuiFlexItem grow={false}>
                <ApiKey label={PUBLIC_KEY_LABEL} apiKey={configuredFields.public_key} />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <ApiKey label={CONSUMER_KEY_LABEL} apiKey={configuredFields.consumer_key} />
              </EuiFlexItem>
            </EuiFlexGroup>
          </>
        )}
      </EuiFlexGroup>
    ),
  };
  const configurationStep = {
    title: i18n.translate(
      'xpack.enterpriseSearch.workplaceSearch.contentSource.saveConfig.oauthStep2',
      {
        defaultMessage: 'Provide the appropriate configuration information',
      }
    ),
    children: (
      <EuiFlexGroup direction="column" responsive={false}>
        <EuiFlexItem>
          <EuiForm>
            {serviceType === 'external' && <ExternalConnectorFormFields />}
            {formFields.map(({ key, label }, index) => (
              <EuiFormRow key={index} label={label}>
                <EuiFieldText
                  value={configuredFields[key]}
                  required
                  type="text"
                  autoComplete="off"
                  onChange={(e) => setConfiguredField(key, e.target.value)}
                  name={key}
                />
              </EuiFormRow>
            ))}
            <EuiSpacer />
            {formActions}
          </EuiForm>
        </EuiFlexItem>
      </EuiFlexGroup>
    ),
  };

  const configSteps =
    serviceType === 'external' ? [configurationStep] : [oauthStep, configurationStep];

  return (
    <>
      {header}
      <EuiSpacer size="l" />
      {serviceType === 'external' && (
        <>
          <EuiText size="s">
            <p>
              {configured ? (
                <FormattedMessage
                  id="xpack.enterpriseSearch.workplaceSearch.contentSource.saveConfig.externalConnectorDocumenation.configuredHeading"
                  defaultMessage="Your self managed {name} connector package is registered with Enterprise Search. Review our {documentationLink} to learn more about configuring a connector package."
                  values={{
                    name,
                    documentationLink: (
                      <EuiLink external target="_blank" href={documentationUrl}>
                        {i18n.translate(
                          'xpack.enterpriseSearch.workplaceSearch.contentSource.saveConfig.externalConnectorDocumenation.documentationLinkLabel',
                          { defaultMessage: 'documentation' }
                        )}
                      </EuiLink>
                    ),
                  }}
                />
              ) : (
                <FormattedMessage
                  id="xpack.enterpriseSearch.workplaceSearch.contentSource.saveConfig.externalConnectorDocumenation.unconfiguredHeading"
                  defaultMessage="Your self managed {name} connector package is now registered with Enterprise Search, and the configuration can now be finalized. Review our {documentationLink}, and collect the credentials from your content source provider in preparation for the next step"
                  values={{
                    name,
                    documentationLink: (
                      <EuiLink external target="_blank" href={documentationUrl}>
                        {i18n.translate(
                          'xpack.enterpriseSearch.workplaceSearch.contentSource.saveConfig.externalConnectorDocumenation.documentationLinkLabel',
                          { defaultMessage: 'documentation' }
                        )}
                      </EuiLink>
                    ),
                  }}
                />
              )}
            </p>
          </EuiText>
          <EuiSpacer size="l" />
        </>
      )}
      <form onSubmit={handleFormSubmission}>
        <EuiSteps steps={configSteps} className="adding-a-source__config-steps" />
      </form>
    </>
  );
};
