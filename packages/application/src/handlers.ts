import type { ComponentTrust } from '@bos-web-engine/common';
import React from 'react';

import { sendMessage } from './container';
import ContainerStoragePlugin from './plugins/container-storage';
import WalletSelectorPlugin from './plugins/wallet-selector';
import { createChildElements, createElement } from './react';
import type {
  ApplicationMethodInvocationParams,
  CallbackInvocationHandlerParams,
  CallbackResponseHandlerParams,
  RenderHandlerParams,
} from './types';

export async function onApplicationMethodInvocation({
  args,
  method,
  componentId,
  onMessageSent,
  requestId,
  social,
  wallet,
}: ApplicationMethodInvocationParams) {
  const sendResponse = (value: any, error?: Error) =>
    sendMessage({
      componentId,
      message: {
        containerId: componentId,
        result: JSON.stringify({ error, value }),
        requestId,
        targetId: componentId,
        type: 'component.callbackResponse',
      },
      onMessageSent,
    });

  try {
    switch (method) {
      /*
        NOTE: Social DB doesn't require extra serialization steps (as of now) so we can pass 
        through directly. The get() method doesn't require a user to be signed in with a wallet. 
        The set() method handles throwing a proper error when the user is not signed in with a 
        wallet. The social db instance passed in is already attached to the current wallet 
        selector instance.
      */

      case 'socialDb.get': {
        return sendResponse(await social.get(args[0] as any));
      }
      case 'socialDb.set': {
        return sendResponse(await social.set(args[0] as any));
      }

      /*
        NOTE: Wallet selector plugin requires more advanced serialization due to use of Buffer. 
        All of the methods also require the user to be signed in with a wallet.
      */

      case 'walletSelector.getAccounts': {
        // Instead of throwing an error, we return an empty array when the user hasn't signed in yet
        if (!wallet) return sendResponse([]);
        return sendResponse(await wallet.getAccounts());
      }
      case 'walletSelector.signAndSendTransaction': {
        if (!wallet)
          throw new Error('Wallet not initialized (user not signed in)');
        return sendResponse(
          await WalletSelectorPlugin.signAndSendTransaction({ args, wallet })
        );
      }
      case 'walletSelector.signMessage':
        if (!wallet)
          throw new Error('Wallet not initialized (user not signed in)');
        return sendResponse(
          await WalletSelectorPlugin.signMessage({ args, wallet })
        );

      case 'containerStorage.getItem': {
        const storageKey = `component_storage/${componentId}/${args[0] as string}`;
        return sendResponse(ContainerStoragePlugin.getItem(storageKey));
      }

      case 'containerStorage.removeItem': {
        const storageKey = `component_storage/${componentId}/${args[0] as string}`;
        return sendResponse(ContainerStoragePlugin.removeItem(storageKey));
      }

      case 'containerStorage.setItem': {
        const [key, value] = args;
        const storageKey = `component_storage/${componentId}/${key as string}`;
        return sendResponse(
          ContainerStoragePlugin.setItem(storageKey, value as string)
        );
      }

      default:
        throw new Error(`Unrecognized method ${method}`);
    }
  } catch (error: any) {
    return sendResponse(undefined, error.toString());
  }
}

export function onCallbackInvocation({
  data,
  onMessageSent,
}: CallbackInvocationHandlerParams) {
  /*
    a component has invoked a callback passed to it as props by its parent component
    post a component callback message to the parent iframe
  */
  const { args, containerId, method, requestId, targetId } = data;
  sendMessage({
    componentId: targetId!,
    message: {
      args,
      method,
      containerId,
      requestId,
      targetId,
      type: 'component.callbackInvocation',
    },
    onMessageSent,
  });
}

export function onCallbackResponse({
  data,
  onMessageSent,
}: CallbackResponseHandlerParams) {
  /*
    a component has executed a callback invoked from another component
    return the value of the callback execution to the calling component
  */
  const { requestId, result, targetId, containerId } = data;
  sendMessage({
    componentId: targetId,
    message: {
      containerId,
      result,
      requestId,
      targetId,
      type: 'component.callbackResponse',
    },
    onMessageSent,
  });
}

interface ChildComponent {
  componentId: string;
  props: any;
  source: string;
  trust: ComponentTrust;
}

/**
 * A component has been rendered, update it in the outer window
 * TODO make a distinction between container-level renders and Component (e.g. trusted) renders
 *  currently containerId may refer to a Component, trusted or internally-defined, within a container
 * @param containerId originating container
 * @param childComponents set of child Components to be loaded dynamically
 * @param debug debug configuration
 * @param mountElement callback to mount the rendered element
 * @param isComponentLoaded callback to determine whether a child Component is available or needs to be loaded
 * @param loadComponent callback to fetch and compile child Component source
 * @param getContainerRenderCount callback to get the number of times this Component has been rendered
 * @param node serialized React node of the updated Component
 * @param onMessageSent callback to be invoked when this Component's DOM posts a message to its container
 */
export function onRender({
  containerId,
  childComponents,
  debug,
  mountElement,
  isComponentLoaded,
  loadComponent,
  getContainerRenderCount,
  node,
  onMessageSent,
}: RenderHandlerParams) {
  const { children, ...props } = node?.props || { children: [] };

  const componentChildren = createChildElements({
    children,
    depth: 0,
    parentId: containerId,
    onMessageSent,
  });
  const element = createElement({
    children: [
      ...(debug?.showContainerBoundaries
        ? [
            React.createElement('div', { className: 'dom-label' }, [
              `[${
                containerId.split('##')[0].split('/')[1]
              } (${getContainerRenderCount(containerId)})]`,
            ]),
          ]
        : []),
      ...[componentChildren].flat(),
    ],
    id: containerId,
    props,
    type: node.type,
    onMessageSent,
  });
  mountElement({ componentId: containerId, element });

  childComponents.forEach(
    ({
      componentId: childComponentId,
      props: componentProps,
      source,
      trust,
    }: ChildComponent) => {
      /*
      a new Component is being rendered by a parent Component, either:
      - this Component is being loaded for the first time
      - the parent Component has updated and is re-rendering this Component
    */
      if (!isComponentLoaded(childComponentId)) {
        /* component code has not yet been loaded, add to cache and load */
        loadComponent({
          componentId: childComponentId,
          componentPath: source,
          trust,
          parentId: containerId,
          props: componentProps,
          renderCount: 0,
        });
      } else {
        /* component iframe is already loaded, post update message to iframe */
        sendMessage({
          componentId: childComponentId,
          onMessageSent,
          message: {
            props: componentProps,
            componentId: childComponentId,
            type: 'component.update',
          },
        });
      }
    }
  );
}
